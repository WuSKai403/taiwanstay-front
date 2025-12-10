import React, { useEffect, useMemo } from 'react';
// @ts-ignore
import twzipcode from 'twzipcode-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TaiwanAddressSelectProps {
    defaultCounty?: string;
    defaultDistrict?: string;
    onCountyChange: (county: string) => void;
    onDistrictChange: (district: string) => void;
    className?: string;
}

const TaiwanAddressSelect: React.FC<TaiwanAddressSelectProps> = ({
    defaultCounty = '',
    defaultDistrict = '',
    onCountyChange,
    onDistrictChange,
    className
}) => {
    const data = useMemo(() => twzipcode(), []);
    const counties = data.counties as string[];
    const zipcodes = data.zipcodes as any[];

    // Get districts for current county
    const districts = useMemo(() => {
        if (!defaultCounty) return [];
        return zipcodes
            .filter(item => item.county === defaultCounty)
            .map(item => item.city); // Note: in twzipcode-data, 'city' is the district name
    }, [defaultCounty, zipcodes]);

    // Handle default district selection if valid
    useEffect(() => {
        if (defaultCounty && defaultDistrict) {
            const isValid = districts.includes(defaultDistrict);
            if (!isValid && districts.length > 0) {
                // If current district is invalid for new county, reset or pick first?
                // Actually parent controls this mostly.
            }
        }
    }, [defaultCounty, defaultDistrict, districts]);

    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            <div className="space-y-1.5">
                <Label>County / City</Label>
                <Select
                    value={defaultCounty}
                    onValueChange={(val) => onCountyChange(val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select County" />
                    </SelectTrigger>
                    <SelectContent>
                        {counties.map((county) => (
                            <SelectItem key={county} value={county}>
                                {county}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label>District</Label>
                <Select
                    value={defaultDistrict}
                    onValueChange={(val) => onDistrictChange(val)}
                    disabled={!defaultCounty}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                        {districts.map((district) => (
                            <SelectItem key={district} value={district}>
                                {district}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default TaiwanAddressSelect;
