#!/usr/bin/env python3
"""Upload a signed bundle to an internal draft using Android Publisher v3."""
import argparse
import os
from pathlib import Path

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--package', default='io.github.oneday1factboop.viciouscycle')
    parser.add_argument('--name', default='Internal test')
    args = parser.parse_args()
    credentials = service_account.Credentials.from_service_account_file(
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'],
        scopes=['https://www.googleapis.com/auth/androidpublisher'])
    session = AuthorizedSession(credentials)
    base = f'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{args.package}/edits'

    def checked(response):
        if not response.ok:
            # API errors do not contain the supplied credential. Do not log request headers.
            raise RuntimeError(f'Google Play API {response.status_code}: {response.text[:1600]}')
        return response.json()

    edit_id = checked(session.post(base, json={}, timeout=60))['id']
    edit_url = f'{base}/{edit_id}'
    committed = False
    try:
        upload_url = (f'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/'
                      f'applications/{args.package}/edits/{edit_id}/bundles?uploadType=media')
        with args.bundle.open('rb') as bundle:
            version = checked(session.post(upload_url, data=bundle,
                headers={'Content-Type': 'application/octet-stream'}, timeout=600))['versionCode']
        notes = [
            {'language': 'en-US', 'text': Path('store/en-US/release-notes.txt').read_text().strip()},
            {'language': 'zh-TW', 'text': Path('store/zh-TW/release-notes.txt').read_text().strip()},
        ]
        checked(session.put(f'{edit_url}/tracks/internal', json={
            'track': 'internal', 'releases': [{'name': args.name,
                'versionCodes': [str(version)], 'status': 'draft', 'releaseNotes': notes}]}, timeout=60))
        checked(session.post(f'{edit_url}:validate', timeout=60))
        checked(session.post(f'{edit_url}:commit', timeout=60))
        committed = True
        print(f'Uploaded version {version} to the Google Play internal draft. Review it in Console.')
    finally:
        if not committed:
            session.delete(edit_url, timeout=30)


if __name__ == '__main__':
    main()
