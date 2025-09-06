import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin, Search, Loader2, Edit3, Map } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "./ui/sonner";

interface LocationPickerProps {
  onLocationSelect: (location: DeliveryLocation) => void;
  initialLocation?: DeliveryLocation;
}

export interface DeliveryLocation {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const LocationPicker = ({ onLocationSelect, initialLocation }: LocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || "");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(initialLocation || null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [hasApiError, setHasApiError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    address: initialLocation?.address || "",
    city: initialLocation?.city || "",
    state: initialLocation?.state || "",
    postalCode: initialLocation?.postalCode || "",
    country: initialLocation?.country || "India"
  });
  const autocompleteService = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  // Load Google Maps Script
  useEffect(() => {
    // Check if API key is provided
    if (!API_KEY) {
      console.warn('Google Maps API key not provided. Using manual entry only.');
      setHasApiError(true);
      setIsScriptLoaded(false);
      return;
    }

    const initializeGoogleMaps = async () => {
      try {
        // Check if Google Maps API is available
        if (!window.google?.maps?.places) {
          throw new Error('Google Maps Places API not available');
        }
        
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        geocoder.current = new window.google.maps.Geocoder();
        
        // Initialize map with small delay to ensure DOM is ready
        setTimeout(() => initializeMap(), 100);
        
        setIsScriptLoaded(true);
        setHasApiError(false);
      } catch (error) {
        console.error('Google Maps API initialization failed:', error);
        setIsScriptLoaded(false);
        setHasApiError(true);
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      // Default location (Delhi, India)
      const defaultLocation = selectedLocation 
        ? { lat: selectedLocation.coordinates.lat, lng: selectedLocation.coordinates.lng }
        : { lat: 28.6139, lng: 77.2090 };

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: selectedLocation ? 15 : 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add marker if location is selected
      if (selectedLocation) {
        new window.google.maps.Marker({
          position: defaultLocation,
          map: mapInstance.current,
          title: 'Delivery Location',
          animation: window.google.maps.Animation.DROP
        });
      }

      // Trigger resize event after map is fully loaded
      window.google.maps.event.addListenerOnce(mapInstance.current, 'idle', () => {
        window.google.maps.event.trigger(mapInstance.current, 'resize');
      });
    };

    const waitForGoogleMaps = async (maxRetries = 10, delay = 500) => {
      setIsInitializing(true);
      
      for (let i = 0; i < maxRetries; i++) {
        if (window.google?.maps?.places?.AutocompleteService) {
          await initializeGoogleMaps();
          setIsInitializing(false);
          return;
        }
        console.log(`Waiting for Google Maps API... attempt ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // If we get here, API failed to load properly
      console.error('Google Maps API failed to load after maximum retries');
      setHasApiError(true);
      setIsScriptLoaded(false);
      setIsInitializing(false);
    };

    if (!window.google) {
      setIsInitializing(true);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait for the API to be fully available
        waitForGoogleMaps();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API script');
        setIsScriptLoaded(false);
        setHasApiError(true);
        setIsInitializing(false);
      };
      document.head.appendChild(script);
    } else {
      // Google Maps already loaded, try to initialize
      waitForGoogleMaps();
    }
  }, []);

  const updateMapLocation = (location: DeliveryLocation) => {
    if (!mapInstance.current) return;
    
    const position = { lat: location.coordinates.lat, lng: location.coordinates.lng };
    
    // Update map center and zoom
    mapInstance.current.setCenter(position);
    mapInstance.current.setZoom(15);
    
    // Clear existing markers
    if (mapInstance.current.markers) {
      mapInstance.current.markers.forEach((marker: any) => marker.setMap(null));
    }
    
    // Add new marker
    const marker = new window.google.maps.Marker({
      position: position,
      map: mapInstance.current,
      title: 'Delivery Location',
      animation: window.google.maps.Animation.DROP
    });
    
    // Store marker reference
    if (!mapInstance.current.markers) {
      mapInstance.current.markers = [];
    }
    mapInstance.current.markers = [marker];
  };

  const handleManualSubmit = () => {
    if (!manualAddress.address || !manualAddress.city || !manualAddress.state) {
      toast.error('Required fields missing', {
        description: 'Please fill in at least address, city, and state.'
      });
      return;
    }

    const fullAddress = `${manualAddress.address}, ${manualAddress.city}, ${manualAddress.state} ${manualAddress.postalCode}, ${manualAddress.country}`;
    
    const location: DeliveryLocation = {
      address: fullAddress,
      city: manualAddress.city,
      state: manualAddress.state,
      postalCode: manualAddress.postalCode,
      country: manualAddress.country,
      coordinates: {
        lat: 28.6139, // Default to Delhi coordinates
        lng: 77.2090,
      },
    };

    setSelectedLocation(location);
    onLocationSelect(location);
    updateMapLocation(location);
  };

  const searchPlaces = useCallback(async (query: string) => {
    if (!isScriptLoaded || !autocompleteService.current || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        input: query,
        componentRestrictions: { country: 'in' }, // Restrict to India
        types: ['address'],
      };

      autocompleteService.current.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5));
        } else {
          setSuggestions([]);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error searching places:', error);
      setIsLoading(false);
    }
  }, [isScriptLoaded]);

  const selectPlace = useCallback(async (placeId: string, description: string) => {
    if (!geocoder.current) return;

    setIsLoading(true);
    setSearchQuery(description);
    setSuggestions([]);

    try {
      geocoder.current.geocode({ placeId }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          let city = '';
          let state = '';
          let postalCode = '';
          let country = '';

          addressComponents.forEach((component: any) => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
            }
          });

          const location: DeliveryLocation = {
            address: result.formatted_address,
            city,
            state,
            postalCode,
            country,
            coordinates: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            },
          };

          setSelectedLocation(location);
          onLocationSelect(location);
          updateMapLocation(location);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error geocoding place:', error);
      setIsLoading(false);
    }
  }, [onLocationSelect]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchPlaces(value);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported', {
        description: 'Your browser does not support location services. Please enter your address manually.'
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (geocoder.current) {
          geocoder.current.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                const result = results[0];
                const addressComponents = result.address_components;
                
                let city = '';
                let state = '';
                let postalCode = '';
                let country = '';

                addressComponents.forEach((component: any) => {
                  const types = component.types;
                  if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                    city = component.long_name;
                  } else if (types.includes('administrative_area_level_1')) {
                    state = component.long_name;
                  } else if (types.includes('postal_code')) {
                    postalCode = component.long_name;
                  } else if (types.includes('country')) {
                    country = component.long_name;
                  }
                });

                const location: DeliveryLocation = {
                  address: result.formatted_address,
                  city,
                  state,
                  postalCode,
                  country,
                  coordinates: { lat: latitude, lng: longitude },
                };

                setSearchQuery(result.formatted_address);
                setSelectedLocation(location);
                onLocationSelect(location);
                updateMapLocation(location);
              }
              setIsLoading(false);
            }
          );
        } else {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Location access denied', {
          description: 'Unable to retrieve your location. Please search manually or enter your address.'
        });
        setIsLoading(false);
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Delivery Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="search">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" disabled={!isScriptLoaded || hasApiError || isInitializing}>
              <Search className="w-4 h-4 mr-2" />
              {isInitializing ? "Loading..." : "Search Address"}
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Edit3 className="w-4 h-4 mr-2" />
              Enter Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {isInitializing ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Initializing Google Maps API...
              </div>
            ) : !isScriptLoaded && !hasApiError ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading location services...
              </div>
            ) : hasApiError ? (
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Location search is temporarily unavailable.
                </p>
                <p className="text-xs text-muted-foreground">
                  Please use manual entry below.
                </p>
                {!API_KEY ? (
                  <p className="text-xs text-amber-600 mt-2">
                    No Google Maps API key found. Set VITE_GOOGLE_MAPS_API_KEY in your .env file.
                  </p>
                ) : (
                  <p className="text-xs text-orange-600 mt-2">
                    Check console for API key or billing issues.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="location-search">Search Address</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="location-search"
                        placeholder="Enter your delivery address..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10"
                      />
                      {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <Button 
                      onClick={getCurrentLocation} 
                      variant="outline"
                      disabled={isLoading}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Current
                    </Button>
                  </div>
                </div>

                {suggestions.length > 0 && (
                  <div className="border border-border rounded-md max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        className="w-full text-left p-3 hover:bg-accent border-b border-border last:border-b-0 transition-colors"
                        onClick={() => selectPlace(suggestion.place_id, suggestion.description)}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{suggestion.structured_formatting?.main_text}</p>
                            <p className="text-xs text-muted-foreground">{suggestion.structured_formatting?.secondary_text}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Fill in your delivery details below
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual-address" className="text-sm font-medium">Street Address *</Label>
                  <Input
                    id="manual-address"
                    placeholder="e.g., 123 Main Street, Apartment 4B"
                    value={manualAddress.address}
                    onChange={(e) => setManualAddress(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-city" className="text-sm font-medium">City *</Label>
                    <Input
                      id="manual-city"
                      placeholder="e.g., Delhi"
                      value={manualAddress.city}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-state" className="text-sm font-medium">State *</Label>
                    <Input
                      id="manual-state"
                      placeholder="e.g., Delhi"
                      value={manualAddress.state}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-postal" className="text-sm font-medium">Postal Code</Label>
                    <Input
                      id="manual-postal"
                      placeholder="e.g., 110001"
                      value={manualAddress.postalCode}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-country" className="text-sm font-medium">Country</Label>
                    <Input
                      id="manual-country"
                      placeholder="e.g., India"
                      value={manualAddress.country}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <Button onClick={handleManualSubmit} className="w-full" size="lg">
                  <MapPin className="w-4 h-4 mr-2" />
                  Confirm Delivery Address
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Map Display */}
        {isScriptLoaded && !hasApiError && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Map className="w-4 h-4" />
              <Label className="text-sm font-medium">Map Preview</Label>
            </div>
            <div 
              ref={mapRef} 
              className="w-full h-64 rounded-lg border border-border overflow-hidden"
              style={{ minHeight: '256px' }}
            />
          </div>
        )}

        {selectedLocation && (
          <div className="bg-accent/50 p-4 rounded-md mt-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Selected Delivery Address:
            </h4>
            <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
            {selectedLocation.city && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedLocation.city}, {selectedLocation.state} {selectedLocation.postalCode}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Global type declaration for Google Maps
declare global {
  interface Window {
    google: any;
  }
}
