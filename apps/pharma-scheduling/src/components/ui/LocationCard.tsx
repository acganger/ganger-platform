/**
 * Location Card Component
 * Professional location selection card for pharmaceutical scheduling
 */

import React from 'react';
import { MapPin, Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import { Button } from '@ganger/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@ganger/ui-catalyst';
import type { Location } from '@/types';

interface LocationCardProps {
  location: Location;
  onSelect: (location: Location) => void;
  className?: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onSelect,
  className
}) => {
  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 group cursor-pointer ${className}`}
      onClick={() => onSelect(location)}
    >
      <CardHeader>
        <CardTitle className="text-gray-900 group-hover:text-blue-600 transition-colors">
          {location.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Address */}
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-gray-600">
              <div className="font-medium">{location.address}</div>
            </div>
          </div>

          {/* Available Days */}
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="text-gray-600">
              <div className="text-sm">
                Available: {location.availableDays.join(', ')}
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="text-gray-600">
              <div className="text-sm">{location.timeRange}</div>
            </div>
          </div>

          {/* Capacity */}
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="text-gray-600">
              <div className="text-sm">
                Up to {location.maxParticipants} participants
              </div>
            </div>
          </div>

          {/* Description */}
          {location.description && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {location.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full group-hover:border-blue-300 group-hover:text-blue-600"
          >
            Select Location
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationCard;