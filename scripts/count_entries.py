#!/usr/bin/env python3
"""Quick script to count entries in dictionary.json"""

import json
from pathlib import Path

def main():
    dict_path = Path('data/dictionary.json')
    
    if not dict_path.exists():
        print(f"❌ {dict_path} not found!")
        return 1
    
    with open(dict_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if isinstance(data, list):
        total = len(data)
        
        # Count by category
        with_byakuzhi = sum(1 for e in data if e.get('byakuzhi', '').strip())
        without_byakuzhi = total - with_byakuzhi
        
        with_ipa = sum(1 for e in data if e.get('ipa', '').strip() and e.get('ipa') not in ['', '【—】', '—'])
        without_ipa = total - with_ipa
        
        print(f"\n📊 Dictionary Statistics:\n")
        print(f"   Total entries: {total:,}")
        print(f"\n   By type:")
        print(f"   • Native words (no byakuzhi): {without_byakuzhi:,}")
        print(f"   • Compounds (with byakuzhi):  {with_byakuzhi:,}")
        print(f"\n   IPA status:")
        print(f"   • With IPA:    {with_ipa:,}")
        print(f"   • Without IPA: {without_ipa:,}")
        
        if total < 10000:
            print(f"\n⚠️  WARNING: Only {total:,} entries found!")
            print(f"   Expected: ~14,804 entries")
            print(f"   Missing: ~{14804 - total:,} entries")
            print(f"\n   🚑 Run the rollback workflow to restore missing entries:")
            print(f"   https://github.com/izaland/izaki-dictionary/actions/workflows/rollback-dictionary.yml")
        else:
            print(f"\n✅ Entry count looks healthy!")
        
        print()
    else:
        print(f"❌ Unexpected data type: {type(data).__name__}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
