type NominatimResult = {
    lat: string;
    lon: string;
    display_name: string;
};

export type GeocodeResult = {
    latitude: number;
    longitude: number;
    label: string;
};

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
    if (!query.trim()) return null;

    const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: "1",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
            "User-Agent": "everly-mobile (learning project)",
        },
    });

    if (!response.ok) {
        throw new Error("Geocoding request failed");
    }

    const results: NominatimResult[] = await response.json();
    const first = results[0];

    if (!first) return null;

    return {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        label: first.display_name,
    };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        format: "json",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: {
            "User-Agent": "everly-mobile (learning project)",
        },
    });

    if (!response.ok) {
        return null;
    }

    const result: { display_name?: string } = await response.json();
    return result.display_name ?? null;
}
