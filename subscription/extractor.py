#!/usr/bin/env python3
"""
eZunder File Extractor
Extracts files from the JSON archive and saves them to the filesystem
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any

class FileExtractor:
    """Extracts files from JSON archive with error handling and validation"""
    
    def __init__(self, json_file_path: str, output_directory: str = "ezunder_extracted"):
        self.json_file_path = json_file_path
        self.output_directory = Path(output_directory)
        self.extracted_files: List[str] = []
        self.errors: List[str] = []
    
    def validate_json_structure(self, data: Dict[str, Any]) -> bool:
        """Validate that the JSON has the expected structure"""
        required_keys = ['project', 'files']
        if not all(key in data for key in required_keys):
            self.errors.append(f"Missing required keys: {required_keys}")
            return False
        
        if not isinstance(data['files'], list):
            self.errors.append("'files' must be a list")
            return False
        
        for i, file_obj in enumerate(data['files']):
            required_file_keys = ['name', 'content', 'suffix']
            if not all(key in file_obj for key in required_file_keys):
                self.errors.append(f"File {i} missing required keys: {required_file_keys}")
                return False
        
        return True
    
    def create_directory_structure(self):
        """Create the output directory structure"""
        try:
            self.output_directory.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created output directory: {self.output_directory}")
        except Exception as e:
            self.errors.append(f"Failed to create directory {self.output_directory}: {str(e)}")
            raise
    
    def extract_file(self, file_obj: Dict[str, Any]) -> bool:
        """Extract a single file from the JSON object"""
        try:
            name = file_obj['name']
            content = file_obj['content']
            suffix = file_obj['suffix']
            path = file_obj.get('path', '')
            
            # Construct the full file path
            if path:
                file_path = self.output_directory / path / f"{name}.{suffix}"
                # Create subdirectory if needed
                file_path.parent.mkdir(parents=True, exist_ok=True)
            else:
                file_path = self.output_directory / f"{name}.{suffix}"
            
            # Write the file content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            self.extracted_files.append(str(file_path))
            print(f"✓ Extracted: {file_path}")
            return True
            
        except Exception as e:
            error_msg = f"Failed to extract file {file_obj.get('name', 'unknown')}: {str(e)}"
            self.errors.append(error_msg)
            print(f"✗ {error_msg}")
            return False
    
    def create_package_json(self, project_data: Dict[str, Any]):
        """Create a package.json file for the React project"""
        package_json = {
            "name": project_data.get('project', 'ezunder').lower(),
            "version": project_data.get('version', '1.0.0'),
            "description": project_data.get('description', 'eZunder ePublishing Platform'),
            "private": True,
            "dependencies": {
                "@auth0/auth0-react": "^2.2.4",
                "@stripe/stripe-js": "^2.4.0",
                "@testing-library/jest-dom": "^5.17.0",
                "@testing-library/react": "^13.4.0",
                "@testing-library/user-event": "^14.5.2",
                "@types/jest": "^27.5.2",
                "@types/node": "^16.18.68",
                "@types/react": "^18.2.42",
                "@types/react-dom": "^18.2.17",
                "axios": "^1.6.2",
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-router-dom": "^6.20.1",
                "react-scripts": "5.0.1",
                "typescript": "^4.9.5",
                "web-vitals": "^2.1.4"
            },
            "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            },
            "eslintConfig": {
                "extends": [
                    "react-app",
                    "react-app/jest"
                ]
            },
            "browserslist": {
                "production": [
                    ">0.2%",
                    "not dead",
                    "not op_mini all"
                ],
                "development": [
                    "last 1 chrome version",
                    "last 1 firefox version",
                    "last 1 safari version"
                ]
            },
            "devDependencies": {
                "@types/testing-library__jest-dom": "^5.14.9",
                "tailwindcss": "^3.3.6",
                "autoprefixer": "^10.4.16",
                "postcss": "^8.4.32"
            }
        }
        
        try:
            package_path = self.output_directory / "package.json"
            with open(package_path, 'w', encoding='utf-8') as f:
                json.dump(package_json, f, indent=2)
            print(f"✓ Created: {package_path}")
        except Exception as e:
            self.errors.append(f"Failed to create package.json: {str(e)}")
    
    def create_env_template(self):
        """Create a .env.example file with required environment variables"""
        env_content = """# eZunder Environment Variables
# Copy this file to .env and fill in your values

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/api

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
REACT_APP_STRIPE_STARTER_PRICE_ID=price_starter_id_here
REACT_APP_STRIPE_PROFESSIONAL_PRICE_ID=price_professional_id_here
REACT_APP_STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_id_here

# Development
NODE_ENV=development
REACT_APP_VERSION=1.0.0
"""
        
        try:
            env_path = self.output_directory / ".env.example"
            with open(env_path, 'w', encoding='utf-8') as f:
                f.write(env_content)
            print(f"✓ Created: {env_path}")
        except Exception as e:
            self.errors.append(f"Failed to create .env.example: {str(e)}")
    
        try:
            readme_path = self.output_directory / "README.md"
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(readme_content)
            print(f"✓ Created: {readme_path}")
        except Exception as e:
            self.errors.append(f"Failed to create README.md: {str(e)}")
    
    def extract_all(self) -> bool:
        """Extract all files from the JSON archive"""
        try:
            # Load JSON data
            with open(self.json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Validate structure
            if not self.validate_json_structure(data):
                return False
            
            # Create output directory
            self.create_directory_structure()
            
            # Extract each file
            success_count = 0
            for file_obj in data['files']:
                if self.extract_file(file_obj):
                    success_count += 1
            
            # Create additional project files
            self.create_package_json(data)
            self.create_env_template()
            
            # Add generation date to project data
            from datetime import datetime
            data['generated_date'] = datetime.now().isoformat()
            self.create_readme(data)
            
            # Summary
            total_files = len(data['files'])
            print(f"\n📊 Extraction Summary:")
            print(f"   Total files in archive: {total_files}")
            print(f"   Successfully extracted: {success_count}")
            print(f"   Failed extractions: {total_files - success_count}")
            print(f"   Additional files created: 3 (package.json, .env.example, README.md)")
            
            if self.errors:
                print(f"\n❌ Errors encountered:")
                for error in self.errors:
                    print(f"   - {error}")
                return False
            
            print(f"\n✅ All files extracted successfully to: {self.output_directory}")
            print(f"   Next steps:")
            print(f"   1. cd {self.output_directory}")
            print(f"   2. npm install")
            print(f"   3. cp .env.example .env")
            print(f"   4. Edit .env with your configuration")
            print(f"   5. npm start")
            
            return True
            
        except FileNotFoundError:
            self.errors.append(f"JSON file not found: {self.json_file_path}")
            return False
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON format: {str(e)}")
            return False
        except Exception as e:
            self.errors.append(f"Unexpected error: {str(e)}")
            return False


def main():
    """Main function to run the file extractor"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Extract eZunder project files from JSON archive',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python extract_files.py ezunder_files.json
  python extract_files.py ezunder_files.json --output my_project
  python extract_files.py ezunder_files.json --output /path/to/project --verbose
        """
    )
    
    parser.add_argument('json_file', help='Path to the JSON file containing project files')
    parser.add_argument('-o', '--output', default='ezunder_extracted', 
                       help='Output directory (default: ezunder_extracted)')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Validate input file exists
    if not os.path.exists(args.json_file):
        print(f"❌ Error: JSON file '{args.json_file}' not found")
        sys.exit(1)
    
    print(f"🚀 eZunder File Extractor")
    print(f"   Source: {args.json_file}")
    print(f"   Output: {args.output}")
    print(f"   Verbose: {args.verbose}")
    print("-" * 50)
    
    # Extract files
    extractor = FileExtractor(args.json_file, args.output)
    success = extractor.extract_all()
    
    if success:
        print("\n🎉 Extraction completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Extraction failed with errors!")
        sys.exit(1)


if __name__ == "__main__":
    main()
