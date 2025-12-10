import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>,
});

interface LocationPickerProps {
    defaultPosition?: [number, number];
    onPositionChange: (lat: number, lng: number) => void;
    address?: string;
    city?: string;
    district?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
    defaultPosition = [25.0330, 121.5654], // Taipei 101 default
    onPositionChange,
    address,
    city,
    district
}) => {
    const [position, setPosition] = useState<[number, number]>(defaultPosition);

    useEffect(() => {
        if (defaultPosition) {
            setPosition(defaultPosition);
        }
    }, [defaultPosition]);

    const handlePositionChange = (lat: number, lng: number) => {
        setPosition([lat, lng]);
        onPositionChange(lat, lng);
    };

    return (
        <div className="h-full w-full">
            <LocationPickerMap defaultPosition={position} onPositionChange={handlePositionChange} />
        </div>
    );
};

export default LocationPicker;
