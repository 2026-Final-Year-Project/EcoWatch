"""Create an attributed EcoWatch reference-candidate layer from GalamseyWatch.

The source index is not an EcoWatch model result. It contains sites that the
source project's model marked confirmed, so EcoWatch presents them as candidates
that must be analysed with its own deployed checkpoint.
"""
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()

    sites = json.loads(arguments.source.read_text())
    features = []
    for site in sites:
        if site.get("status") != "confirmed":
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [site["lng"], site["lat"]]},
            "properties": {
                "id": f"earthrise-reference-{site['id']}",
                "name": "Reference mining candidate",
                "label": "Analyse with EcoWatch to verify this location",
                "source": "Earthrise Ghana mining index; GalamseyWatch model-verified candidate",
                "source_url": "https://github.com/apoa5/GalamseyWatch",
                "color": "#d97706",
                "status": "reference_candidate",
            },
        })
    collection = {
        "type": "FeatureCollection",
        "name": "EcoWatch reference mining candidates",
        "license_notice": "Derived from GalamseyWatch (MIT License, Copyright 2026 Samuel Donkor). Underlying Earthrise data retains its own terms.",
        "features": features,
    }
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    arguments.output.write_text(json.dumps(collection, indent=2))
    print(f"Wrote {len(features)} reference candidates to {arguments.output}")


if __name__ == "__main__":
    main()
