#!/usr/bin/env python3
"""
apply_plan_changes.py
Usage: python scripts/apply_plan_changes.py [plan_changes.json]

Reads a JSON file describing new plans (array under key "plans") and appends
columns for each plan to the pricing HTML files: Pricingai.html, Pricinghuman.html,
Pricinghybrid.html located in the repository root.

The script uses BeautifulSoup to safely modify the table: it appends a new <th>
into the first <thead><tr> and appends a <td> to each <tbody><tr>. For header price
cells the script sets a unique id and a data-monthly attribute so the client-side
JS on those pages can continue to compute quarterly/yearly views.

Example plan_changes.json:
{
  "plans": [ {"name":"New Plan","monthly":1999}, {"name":"VIP","monthly":15999} ]
}

Note: Requires BeautifulSoup4. Install with: pip install beautifulsoup4
"""
import sys
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [ROOT / 'Pricingai.html', ROOT / 'Pricinghuman.html', ROOT / 'Pricinghybrid.html']

def load_changes(path: Path):
    if not path.exists():
        print(f"Error: {path} not found.")
        sys.exit(1)
    data = json.loads(path.read_text(encoding='utf-8'))
    return data.get('plans', [])


def make_header_th(soup, name, monthly):
    # Build a <th> element similar to others: title, price span with id/data-monthly, unit, button
    th = soup.new_tag('th')
    th['class'] = 'p-6 md:p-8 w-1/4 align-bottom'
    h3 = soup.new_tag('h3')
    h3['class'] = 'text-lg font-bold'
    h3.string = name
    div = soup.new_tag('div')
    div['class'] = 'flex items-baseline gap-1 mb-4'
    id_stamp = f"price{abs(hash(name + str(monthly))) % (10**9)}"
    span_price = soup.new_tag('span')
    span_price['id'] = id_stamp
    span_price['class'] = 'text-3xl font-black'
    span_price['data-monthly'] = str(monthly)
    span_price.string = f"₹{monthly:,}"
    span_unit = soup.new_tag('span')
    span_unit['class'] = 'text-sm text-[#4c739a]'
    span_unit.string = '/mo'
    div.append(span_price)
    div.append(span_unit)
    btn = soup.new_tag('button')
    btn['class'] = 'w-full py-2.5 rounded-lg border text-sm'
    btn.string = 'Choose Plan'
    th.append(h3)
    th.append(div)
    th.append(btn)
    return th


def append_plan_to_file(path: Path, plan_name: str, monthly: int):
    print(f"Applying plan '{plan_name}' ({monthly}) to {path.name}...")
    html = path.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    thead_tr = soup.find('thead')
    if not thead_tr:
        print(f"Warning: no <thead> found in {path}, skipping")
        return
    thead_row = thead_tr.find('tr')
    if not thead_row:
        print(f"Warning: no header row found in {path}, skipping")
        return
    # append new header th
    new_th = make_header_th(soup, plan_name, monthly)
    thead_row.append(new_th)

    # append a td for each tbody tr
    tbody = soup.find('tbody')
    if not tbody:
        print(f"Warning: no <tbody> in {path}, skipping body updates")
    else:
        for tr in tbody.find_all('tr'):
            # if this row is a section header (colspan) append an empty cell
            first_td = tr.find('td')
            if first_td and first_td.has_attr('colspan'):
                td = soup.new_tag('td')
                td['class'] = 'px-6 py-3'
                td.string = ''
                tr.append(td)
            else:
                td = soup.new_tag('td')
                td['class'] = 'px-6 py-4 text-center'
                td.string = '-'
                tr.append(td)

    # write back
    path.write_text(str(soup), encoding='utf-8')
    print(f"Updated {path.name}")


def main():
    plan_file = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'plan_changes.json'
    plans = load_changes(plan_file)
    if not plans:
        print("No plans to apply. Ensure the JSON contains a 'plans' array.")
        return
    for plan in plans:
        name = plan.get('name') or 'New Plan'
        monthly = int(plan.get('monthly') or plan.get('monthly_price') or 0)
        for target in TARGETS:
            if target.exists():
                append_plan_to_file(target, name, monthly)
            else:
                print(f"Target {target} not found, skipping.")
    print("Done. Please open the pricing HTML files to verify the changes.")

if __name__ == '__main__':
    main()
