# 🗺️ Google Maps Integration Setup Guide

## 🚀 **Step 1: Get Google Maps API Key**

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 1.2 Create/Select Project
- Click on the project dropdown at the top
- Click "New Project" or select existing project
- Give it a name like "Delivery App Maps"

### 1.3 Enable Maps JavaScript API
- In the left sidebar, click "APIs & Services" > "Library"
- Search for "Maps JavaScript API"
- Click on it and click "Enable"

### 1.4 Create API Key
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "API Key"
- Copy the generated API key

### 1.5 Restrict API Key (Security)
- Click on the created API key
- Under "Application restrictions", select "HTTP referrers"
- Add your domains:
  - `http://localhost:3000/*` (for development)
  - `https://yourdomain.com/*` (for production)
- Under "API restrictions", select "Restrict key"
- Choose "Maps JavaScript API"
- Click "Save"

## 🔧 **Step 2: Configure Environment**

### 2.1 Update .env file
Add this line to your `delivery-app/web-portal/.env` file:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Replace `your_actual_api_key_here` with the API key you copied from Google Cloud Console.**

### 2.2 Restart Development Server
After updating the .env file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🎯 **Step 3: Test the Integration**

### 3.1 Navigate to Order Details
1. Go to Orders page in your app
2. Click "View" on any order
3. Scroll down to "Order Tracking" section

### 3.2 What You Should See
- **Interactive Google Map** instead of placeholder
- **Green marker (P)** for pickup location
- **Red marker (D)** for delivery location  
- **Blue marker (🚚)** for driver location
- **Blue route line** showing the delivery path
- **Map controls** for zoom, fullscreen, etc.

## 🎮 **Features Available**

### Map Controls
- **Zoom In/Out** buttons
- **Center on Driver** button
- **Fullscreen** toggle
- **Live Tracking** toggle

### Visual Elements
- **Pickup Location**: Green marker with "P" label
- **Delivery Location**: Red marker with "D" label
- **Driver Location**: Blue marker with truck emoji
- **Route Path**: Blue line showing delivery route
- **Real-time Updates**: Driver position updates every 5 seconds

## 💰 **Cost Information**

### Google Maps Pricing
- **Free Tier**: $200 monthly credit
- **Maps JavaScript API**: $7 per 1000 map loads
- **Typical Development**: Usually free (under $200/month)
- **Production**: Depends on usage volume

### Cost Optimization
- Restrict API key to your domains only
- Monitor usage in Google Cloud Console
- Set up billing alerts

## 🚨 **Troubleshooting**

### Common Issues

#### 1. "Failed to load Google Maps"
- Check if API key is correct in .env file
- Verify Maps JavaScript API is enabled
- Check browser console for specific errors

#### 2. "This API project is not authorized"
- Enable Maps JavaScript API in Google Cloud Console
- Wait a few minutes for changes to propagate

#### 3. "API key not valid"
- Verify API key is copied correctly
- Check if API key has restrictions that block your domain
- Ensure billing is enabled on your Google Cloud project

#### 4. Map shows but no markers
- Check if backend tracking APIs are working
- Verify network requests in browser dev tools
- Check if orderId is being passed correctly

### Debug Steps
1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for API calls
4. Verify environment variables are loaded

## 🔒 **Security Best Practices**

### API Key Security
- ✅ Restrict API key to specific domains
- ✅ Enable API restrictions
- ✅ Monitor usage and costs
- ❌ Never commit API key to public repositories
- ❌ Don't expose API key in client-side code (use environment variables)

### Production Considerations
- Use different API keys for development and production
- Set up proper domain restrictions
- Monitor API usage and costs
- Consider implementing rate limiting

## 📱 **Mobile Responsiveness**

The map component is fully responsive and works on:
- Desktop browsers
- Mobile browsers
- Tablet devices
- Different screen sizes

## 🎨 **Customization Options**

### Map Styling
You can customize the map appearance by modifying `src/config/maps.ts`:

```typescript
MAP_STYLES: [
  // Add custom styles here
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  }
]
```

### Marker Icons
Customize marker icons by updating the URLs in the config:

```typescript
MARKER_ICONS: {
  pickup: 'path/to/custom/pickup-icon.png',
  delivery: 'path/to/custom/delivery-icon.png',
  driver: 'path/to/custom/driver-icon.png'
}
```

## 🚀 **Next Steps**

After successful setup, consider:
1. **Real-time Updates**: Implement WebSocket for live driver tracking
2. **Route Optimization**: Add Google Directions API for optimal routes
3. **Geocoding**: Add address lookup and validation
4. **Distance Calculation**: Implement delivery time estimates
5. **Traffic Integration**: Add real-time traffic data

## 📞 **Support**

If you encounter issues:
1. Check this troubleshooting guide
2. Review Google Maps API documentation
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

**Happy Mapping! 🗺️✨**
