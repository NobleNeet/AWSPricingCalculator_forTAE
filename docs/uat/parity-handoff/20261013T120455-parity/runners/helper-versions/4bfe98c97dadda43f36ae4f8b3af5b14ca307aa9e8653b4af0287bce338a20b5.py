import json, pathlib, hashlib
root = pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/' + pathlib.Path('/tmp/aws-parity-current').read_text())
records = json.loads((root / 'measured-cases.json').read_text())
for side in ('aws', 'local'):
    inventory_path = root / (side + '-field-inventory.json')
    inventory = json.loads(inventory_path.read_text())
    existing = {o['observation'] for o in inventory}
    count = 0
    for case in records:
        for slot in ('Before', 'After', 'Setup'):
            value = case.get(side + slot) if slot != 'Setup' else case.get('setup' + side.title())
            if not value:
                continue
            token = hashlib.sha256((case['caseId'] + '|' + str(case.get('startedAt')) + '|' + slot).encode()).hexdigest()[:20]
            name = f'observations/case-{side}-{case["serviceId"]}-{token}.json'
            if name in existing:
                continue
            fields = []
            for index, f in enumerate(value.get('inputs', [])):
                # Component toggles lacking DOM IDs remain in their original independent inventory.
                # Do not invent identities by merging their repeated generic captions.
                if side == 'local' and not f.get('id'):
                    continue
                fields.append({
                    'domId': f.get('id', ''), 'index': index,
                    'tag': 'BUTTON' if f.get('type') == 'button' else 'SELECT' if f.get('type') == 'select-one' else 'INPUT',
                    'type': f.get('type', ''), 'label': f.get('label', ''),
                    'value': f.get('value'), 'visible': f.get('visible'),
                    'disabled': f.get('disabled'), 'min': f.get('min'),
                    'max': f.get('max'), 'step': f.get('step'), 'options': None,
                    'context': '', 'section': '', 'role': f.get('role'),
                })
            selectors = [{'label': f.get('label'), 'value': f.get('value')} for f in fields
                         if f.get('type') in ('button', 'select-one', 'radio', 'checkbox')]
            region_names={'Asia Pacific (Tokyo)':'ap-northeast-1','Asia Pacific (Osaka)':'ap-northeast-3','US East (N. Virginia)':'us-east-1','US East (Ohio)':'us-east-2','US West (N. California)':'us-west-1','US West (Oregon)':'us-west-2'}
            actual_region=next((f.get('value') for f in fields if side=='local' and f['domId']=='project-region'),None) if side=='local' else region_names.get(next((f.get('value') for f in fields if f['label'].startswith('Choose a Region')),None))
            condition = {'variant': 'pricing-case-gui-observation', 'region': actual_region, 'requestedRegion':case['region'],
                         'profileRequested': case['profile'],
                         'caseId': case['caseId'], 'slot': slot,
                         'source': 'actual-gui-case-snapshot'}
            if side == 'local':
                condition['profile'] = {'value': case['profile']}
            observation = {'side': side, 'serviceId': case['serviceId'], 'condition': condition,
                           'url': value['url'], 'observedAt': value['observedAt'], 'fields': fields,
                           'text': value.get('text'), 'screen': value.get('screen'),
                           'totalScreen': value.get('totalScreen'), 'monthlyDisplay': value.get('monthlyDisplay'),
                           'priceMeta': value.get('priceMeta'), 'sourceCase': case['caseId'],
                           'sourceSlot': slot, 'sourceArtifact': 'measured-cases.json', 'observedSelectors': selectors}
            (root / name).write_text(json.dumps(observation, ensure_ascii=False, indent=2) + '\n')
            inventory.append({**observation, 'text': None, 'observation': name})
            existing.add(name)
            count += 1
    inventory_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n')
    print(side, 'new actual GUI observations', count)
