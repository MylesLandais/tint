"""Generate the "Big" books dataset for the Tint dataset-editor demo.

Source: Open Library search API (https://openlibrary.org/developers/api).
Open Library bibliographic metadata is dedicated to the public domain (CC0),
see https://openlibrary.org/developers/dumps. Real columns: title, authors,
first publish year, subjects, median page count, ISBN, language, cover id,
edition count. Synthetic columns (seeded from the work key so output is
stable and reviewable as a diff): rating, status, owned, notes, shelf.

Usage:  python3 scripts/gen-books.py [--cache DIR] [--per-subject N]
Output: public/data/books.json  (committed; loaded lazily by the docs demo)
"""
import argparse, hashlib, json, pathlib, random, sys, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/data/books.json'
UA = 'tint-docs-dataset/1.0 (https://github.com/tint)'
FIELDS = 'key,title,author_name,first_publish_year,subject,number_of_pages_median,isbn,language,cover_i,edition_count'

SUBJECTS = [
    'fantasy', 'science_fiction', 'mystery', 'romance', 'horror', 'thriller', 'historical_fiction',
    'humor', 'poetry', 'drama', 'history', 'biography', 'philosophy', 'psychology', 'economics',
    'politics', 'law', 'medicine', 'mathematics', 'physics', 'computers', 'nature', 'travel',
    'cooking', 'art', 'music', 'architecture', 'sports', 'religion', 'education', 'children',
]

SHELVES = [
    {'id': 'shelf-reading', 'name': 'Currently reading'},
    {'id': 'shelf-queue', 'name': 'Up next'},
    {'id': 'shelf-favorites', 'name': 'Favorites'},
    {'id': 'shelf-reference', 'name': 'Reference'},
    {'id': 'shelf-lend', 'name': 'Lent out'},
    {'id': 'shelf-archive', 'name': 'Archive'},
]
STATUS = ['Unread', 'Unread', 'Unread', 'Reading', 'Finished', 'Finished', 'Finished', 'Abandoned']
NOTES = [
    '', '', '', '', '', 'Recommended by a friend.', 'Re-read every few years.',
    'Great opening chapter, uneven middle.', 'Check the later editions for the revised preface.',
    'Borrowed copy; buy a paperback.', 'Pairs well with the author\'s earlier work.',
    'Dense, but worth the slow read.', 'Gift candidate.',
]


def fetch(subject, limit, cache):
    cached = cache / f'{subject}.json'
    if cached.exists():
        return json.loads(cached.read_text())
    q = urllib.parse.urlencode({'q': f'subject:{subject}', 'limit': limit, 'fields': FIELDS, 'sort': 'editions'})
    req = urllib.request.Request(f'https://openlibrary.org/search.json?{q}', headers={'User-Agent': UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                docs = json.load(r)['docs']
            cached.write_text(json.dumps(docs))
            time.sleep(1.0)  # be polite
            return docs
        except Exception as e:  # noqa: BLE001
            print(f'  retry {subject}: {e}', file=sys.stderr)
            time.sleep(3 * (attempt + 1))
    return []


def isbn13(isbns):
    for i in isbns or []:
        if len(i) == 13 and i.isdigit():
            return i
    return (isbns or [''])[0]


def rng_for(key):
    return random.Random(int(hashlib.sha1(key.encode()).hexdigest()[:12], 16))


def build(doc, subject):
    key = doc['key'].rsplit('/', 1)[-1]
    r = rng_for(key)
    subjects = []
    for s in doc.get('subject', []):
        s = s.strip()
        if 2 < len(s) <= 28 and s.lower() not in [x.lower() for x in subjects]:
            subjects.append(s)
        if len(subjects) == 3:
            break
    if not subjects:
        subjects = [subject.replace('_', ' ').title()]
    status = r.choice(STATUS)
    rated = status in ('Finished', 'Abandoned') or r.random() < 0.1
    return {
        'id': key,
        'title': doc['title'].strip(),
        'authors': (doc.get('author_name') or ['Unknown'])[:3],
        'year': doc.get('first_publish_year'),
        'subjects': subjects,
        'pages': doc.get('number_of_pages_median'),
        'isbn': isbn13(doc.get('isbn')),
        'language': (doc.get('language') or ['eng'])[0],
        'editions': doc.get('edition_count') or 1,
        'url': f'https://openlibrary.org/works/{key}',
        'cover': doc.get('cover_i'),
        'rating': r.randint(1, 5) if rated else None,
        'status': status,
        'owned': r.random() < 0.35,
        'notes': r.choice(NOTES),
        'shelf': r.choice(SHELVES)['id'] if r.random() < 0.55 else None,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default=str(ROOT / '.cache/openlibrary'))
    ap.add_argument('--per-subject', type=int, default=800)
    args = ap.parse_args()
    cache = pathlib.Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)

    seen, rows = set(), []
    for subject in SUBJECTS:
        docs = fetch(subject, args.per_subject, cache)
        added = 0
        for d in docs:
            if 'key' not in d or not d.get('title') or d['key'] in seen:
                continue
            seen.add(d['key'])
            rows.append(build(d, subject))
            added += 1
        print(f'{subject:20s} +{added}', file=sys.stderr)

    rows.sort(key=lambda b: b['id'])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'shelves': SHELVES, 'books': rows}, ensure_ascii=False, separators=(',', ':')))
    print(f'{len(rows)} books -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1e6:.1f} MB)', file=sys.stderr)


if __name__ == '__main__':
    main()
