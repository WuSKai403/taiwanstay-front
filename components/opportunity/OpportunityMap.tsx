"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Opportunity } from "@/lib/api/opportunity";
import { OpportunityCard } from "./OpportunityCard";

// Fix for default marker icons in Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when opportunities change
function MapUpdater({ opportunities }: { opportunities: Opportunity[] }) {
    const map = useMap();

    useEffect(() => {
        if (opportunities.length > 0) {
            const bounds = L.latLngBounds(
                opportunities
                    .filter(o => o.location?.coordinates?.coordinates)
                    .map(o => [o.location!.coordinates.coordinates[1], o.location!.coordinates.coordinates[0]])
            );

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [opportunities, map]);

    return null;
}

interface OpportunityMapProps {
    opportunities: Opportunity[];
}

export default function OpportunityMap({ opportunities }: OpportunityMapProps) {
    // Default center (Taiwan)
    const defaultCenter: [number, number] = [23.5, 121];
    const defaultZoom = 8;

    const validOpportunities = useMemo(() => {
        return opportunities.filter(o =>
            o.location?.coordinates?.coordinates &&
            o.location.coordinates.coordinates.length === 2
        );
    }, [opportunities]);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater opportunities={validOpportunities} />

            {validOpportunities.map((opp) => (
                <Marker
                    key={opp.id}
                    position={[
                        opp.location!.coordinates.coordinates[1], // Latitude
                        opp.location!.coordinates.coordinates[0], // Longitude
                    ]}
                >
                    <Popup minWidth={300} maxWidth={300}>
                        <div className="p-0">
                            <OpportunityCard opportunity={opp as any} />
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
