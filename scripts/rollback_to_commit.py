#!/usr/bin/env python3
"""
Rollback dictionary.json to a specific commit.

Usage:
    python scripts/rollback_to_commit.py <commit_sha>

Example:
    python scripts/rollback_to_commit.py 1d69383d8f006de84c5461f6be21e4d9b6985d00
"""

import sys
import json
import urllib.request
from pathlib import Path

def download_file_from_commit(owner, repo, commit_sha, file_path):
    """
    Download a file from a specific commit using GitHub raw URL.
    
    Args:
        owner: Repository owner
        repo: Repository name
        commit_sha: Git commit SHA
        file_path: Path to file in repository
    
    Returns:
        Content of the file as string
    """
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{commit_sha}/{file_path}"
    
    print(f"📥 Downloading from: {url}")
    print(f"   This may take a moment for large files...")
    
    try:
        with urllib.request.urlopen(url) as response:
            content = response.read().decode('utf-8')
            return content
    except urllib.error.HTTPError as e:
        print(f"❌ Error: HTTP {e.code} - {e.reason}")
        print(f"   URL: {url}")
        if e.code == 404:
            print(f"   File or commit not found!")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error downloading file: {e}")
        sys.exit(1)

def validate_json(content):
    """
    Validate that content is valid JSON.
    
    Returns:
        Parsed JSON object or None if invalid
    """
    try:
        data = json.loads(content)
        return data
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/rollback_to_commit.py <commit_sha>")
        print("\nExample:")
        print("  python scripts/rollback_to_commit.py 1d69383d8f006de84c5461f6be21e4d9b6985d00")
        sys.exit(1)
    
    commit_sha = sys.argv[1].strip()
    
    # Configuration
    owner = "izaland"
    repo = "izaki-dictionary"
    file_path = "data/dictionary.json"
    
    print(f"\n🔄 Rolling back dictionary.json to commit: {commit_sha[:8]}...\n")
    
    # Download file from commit
    content = download_file_from_commit(owner, repo, commit_sha, file_path)
    
    print(f"✅ Downloaded {len(content):,} bytes\n")
    
    # Validate JSON
    print(f"🔍 Validating JSON...")
    data = validate_json(content)
    
    if data is None:
        print(f"❌ Downloaded content is not valid JSON!")
        sys.exit(1)
    
    if isinstance(data, list):
        print(f"✅ Valid JSON array with {len(data):,} entries\n")
    else:
        print(f"⚠️  Warning: Expected JSON array, got {type(data).__name__}\n")
    
    # Backup current file
    local_path = Path(file_path)
    backup_path = Path('data/dictionary_before_rollback.json')
    
    if local_path.exists():
        print(f"💾 Creating backup of current dictionary...")
        with open(local_path, 'r', encoding='utf-8') as f:
            current_content = f.read()
        
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(current_content)
        
        print(f"   Backup saved to: {backup_path}\n")
    
    # Write rolled-back version
    print(f"✍️  Writing rolled-back dictionary to {local_path}...")
    
    with open(local_path, 'w', encoding='utf-8') as f:
        # Write pretty-printed JSON for readability
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ SUCCESS! Dictionary rolled back to commit {commit_sha[:8]}")
    print(f"\n📊 Statistics:")
    if isinstance(data, list):
        print(f"   Total entries: {len(data):,}")
    
    print(f"\n📝 Next steps:")
    print(f"   1. Verify the dictionary is correct:")
    print(f"      python scripts/diagnose_structure.py")
    print(f"\n   2. Commit the rollback:")
    print(f"      git add data/dictionary.json")
    print(f"      git commit -m '🚑 ROLLBACK: Restore dictionary to {commit_sha[:8]}'")
    print(f"      git push")
    print(f"\n   3. If something went wrong, restore from backup:")
    print(f"      cp data/dictionary_before_rollback.json data/dictionary.json")

if __name__ == '__main__':
    main()
