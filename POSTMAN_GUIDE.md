# Event Planner API - Postman Collection

## 📥 Import to Postman

### Method 1: Import Files
1. Open Postman
2. Click **Import** button
3. Select these files:
   - `Event-Planner-API.postman_collection.json`
   - `Event-Planner-Dev.postman_environment.json`
4. Click **Import**

### Method 2: Drag & Drop
- Drag both JSON files into Postman window

## 🔧 Setup

### 1. Select Environment
- In top-right corner, select **Event Planner - Development** environment
- This sets `baseUrl` to `http://localhost:3000`

### 2. Start Your Server
```bash
npm run dev
```

### 3. Test Health Check
- Open **Health Check** request
- Click **Send**
- Should return: `{ "status": "OK" }`

## 🚀 Quick Start Guide

### Step 1: Register a User
1. Go to **Authentication → Register**
2. Click **Send**
3. User will be created (check email for verification)

### Step 2: Login
1. Go to **Authentication → Login**
2. Update email/password in body if needed
3. Click **Send**
4. **Access token automatically saved** to environment variable ✨

### Step 3: Verify Email (Optional)
1. Check your email for verification link
2. Copy the token from the URL
3. Go to **Authentication → Verify Email**
4. Paste token in body
5. Click **Send**

### Step 4: Create an Event
1. Go to **Events → Create Event**
2. Modify the event details in body
3. Click **Send**
4. Event created! ✅

### Step 5: RSVP to Event
1. Go to **RSVP → Create/Update RSVP**
2. Set `:eventId` in URL (e.g., `1`)
3. Choose status: `yes`, `no`, or `maybe`
4. Click **Send**

## 📚 Collection Structure

### 🔐 Authentication (7 requests)
- **Register** - Create new account
- **Login** - Get access tokens (auto-saves to variables)
- **Get Profile** - View user info
- **Refresh Token** - Renew access token
- **Logout** - Invalidate refresh token
- **Verify Email** - Verify email with token
- **Resend Verification** - Request new verification email

### 📅 Events (7 requests)
- **Get All Events** - Paginated list with filters
- **Get Event by ID** - Single event details
- **Get My Events** - User's created events
- **Get Dashboard Stats** - User statistics
- **Create Event** - New event (requires verified email)
- **Update Event** - Edit event (owner only)
- **Delete Event** - Remove event (owner only)

### 🏷️ Tags (5 requests)
- **Get All Tags** - List all tags
- **Get Tag by ID** - Single tag
- **Create Tag** - New tag
- **Update Tag** - Edit tag
- **Delete Tag** - Remove tag

### ✅ RSVP (5 requests)
- **Create/Update RSVP** - RSVP yes/no/maybe
- **Get My RSVP for Event** - Check your RSVP
- **Get Event RSVPs** - All RSVPs with summary
- **Get My RSVPs** - All your RSVPs
- **Cancel RSVP** - Remove RSVP

### 🏥 Health Check (1 request)
- **Health Check** - Server status

## 🔑 Authentication Flow

### Automatic Token Management
The collection includes **test scripts** that automatically save tokens:

```javascript
// After successful login, tokens are saved automatically
var jsonData = pm.response.json();
pm.collectionVariables.set('accessToken', jsonData.data.accessToken);
pm.collectionVariables.set('refreshToken', jsonData.data.refreshToken);
```

### Manual Token Update
If needed, update tokens manually:
1. Click ⚙️ (gear icon) → Environments
2. Select **Event Planner - Development**
3. Update `accessToken` value
4. Click **Save**

### Using Auth in Requests
Most requests use **Bearer Token** authentication automatically.
The token is read from `{{accessToken}}` variable.

## 📖 Request Examples

### Create Event with Tags
```json
POST /api/events
{
  "title": "Tech Conference 2026",
  "description": "Annual technology conference",
  "event_date": "2026-06-15T09:00:00Z",
  "event_end_date": "2026-06-15T17:00:00Z",
  "location": "Convention Center",
  "event_type": "public",
  "tag_ids": [1, 2, 3]
}
```

### Filter Events
```
GET /api/events?page=1&limit=10&search=conference&upcoming=true&event_type=public
```

### RSVP to Event
```json
POST /api/rsvps/events/5
{
  "status": "yes"
}
```

## 🔍 Query Parameters

### Events Filtering
| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `page` | number | 1+ | Page number |
| `limit` | number | 1-100 | Items per page |
| `search` | string | - | Search in title/description/location |
| `tag_ids` | string | 1,2,3 | Comma-separated tag IDs |
| `event_type` | string | public/private | Event visibility |
| `upcoming` | boolean | true/false | Future events only |
| `past` | boolean | true/false | Past events only |
| `sort_by` | string | event_date/created_at/title | Sort field |
| `sort_order` | string | asc/desc | Sort direction |

## 🎯 Common Workflows

### Creating a Complete Event
1. **Login** to get token
2. **Get All Tags** to see available tags
3. **Create Event** with selected tags
4. **Get Event by ID** to verify creation

### Managing RSVPs
1. **Login** as user
2. **Get All Events** to find events
3. **Create/Update RSVP** for an event
4. **Get Event RSVPs** to see all responses
5. **Get My RSVPs** to see all your RSVPs

### User Verification Flow
1. **Register** new account
2. Check email for verification link
3. **Verify Email** with token
4. **Get Profile** to confirm `email_verified_at` is set
5. **Create Event** (now allowed with verified email)

## ⚠️ Common Issues

### 401 Unauthorized
- **Solution**: Login again to get new access token
- Or use **Refresh Token** request

### 403 Forbidden - Email Not Verified
- **Solution**: 
  1. Use **Verify Email** with token from email
  2. Or use **Resend Verification** to get new email

### 404 Event Not Found
- **Solution**: Verify the event ID in the URL parameter

### 400 Validation Error
- **Solution**: Check request body matches the required schema

## 🛠️ Variables

### Collection Variables
- `baseUrl` - API base URL (default: `http://localhost:3000`)
- `accessToken` - JWT access token (auto-updated on login)
- `refreshToken` - JWT refresh token (auto-updated on login)

### Using Variables
In requests, use double curly braces:
- `{{baseUrl}}/api/events`
- `Authorization: Bearer {{accessToken}}`

## 📝 Tips

1. **Order Matters**: Login before making authenticated requests
2. **Auto-Save**: Tokens save automatically after login/refresh
3. **URL Params**: Update `:id` or `:eventId` in URL for specific resources
4. **Test Responses**: Check response status and data structure
5. **Environment**: Can create Production environment with different baseUrl

## 🐛 Debugging

### View Variables
1. Click 👁️ (eye icon) in top-right
2. See current variable values

### Console
1. Open Postman Console (bottom-left)
2. View request/response details
3. See test script outputs

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (login required)
- `403` - Forbidden (email verification or permission)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Server Error

## 🔄 Keep Collection Updated

When API changes:
1. Export updated collection from Postman
2. Replace `Event-Planner-API.postman_collection.json`
3. Commit to version control

## 📦 Exporting

To share with team:
1. Right-click collection
2. Select **Export**
3. Choose **Collection v2.1**
4. Share the JSON file

---

**Happy Testing! 🚀**

For issues or questions, check the API documentation or server logs.
