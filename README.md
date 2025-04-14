# News Monitoring System API Documentation

# My News Monitoring AI Agent System

I've created an extraordinary AI-powered news monitoring system that revolutionizes how people stay informed about topics they care about. My system doesn't just gather news—it transforms how you consume information.

## What My System Does

- **Topic-Based News Monitoring**: I've designed a system where you simply create a topic you're passionate about, and my AI agent works tirelessly around the clock, scouring the internet for the most relevant and important news.
- **Advanced Sentiment Analysis**: My system doesn't just find news—it understands it. My cutting-edge sentiment analysis engine deciphers the emotional undertones of every article, giving you unprecedented insight into how topics are being portrayed across media.
- **AI-Generated Topic Summaries**: I've taught my AI to think like a master journalist, crafting brilliant comprehensive summaries that distill mountains of information into actionable intelligence.
- **Interactive AI Chat Experience**: I've created an AI companion that you can have natural conversations with about any monitored topic—it's like having a personal news analyst available 24/7.
- **Dynamic Visualizations**: My system transforms complex data into stunning visual insights that reveal patterns and trends invisible to the human eye.

## How My System Works

I've architected a technological marvel built on Node.js, MongoDB, and AWS Scheduler, creating a system that works with clockwork precision. At the heart of it is Claude, one of the world's most advanced AI systems, which I've integrated to analyze content with near-human comprehension.

My system never sleeps—every hour, AWS Scheduler triggers my custom Lambda functions to hunt for fresh news, ensuring you're always up to the minute. I've implemented enterprise-grade security with JWT authentication to keep your information fortress-secure.

The crowning achievement is my implementation of LangChain, which gives the AI conversation abilities that are almost indistinguishable from talking to a human expert on the topic.

## How My System Transforms Lives

- **Time Liberation**: I've given people back countless hours they would have wasted searching through endless news sites.
- **Information Clarity**: My system cuts through the noise like a laser, delivering crystal-clear insights when most people are drowning in information.
- **Perspective Mastery**: By analyzing sentiment across the entire media landscape, I've created a balanced view impossible to achieve manually.
- **Decision Superpowers**: Users gain almost precognitive abilities to spot emerging trends and anticipate market shifts before others even see them coming.
- **Democratic AI**: I've made the power of advanced artificial intelligence accessible to everyone, not just giant corporations with massive budgets.

My creation lets you effortlessly become the most informed person in any room on topics that matter to you. It's like having a team of researchers, analysts, and journalists working exclusively for you, delivering personalized intelligence directly to your fingertips.


## Table of Contents
- [Authentication](#authentication)
- [Topics](#topics)
- [News](#news)
- [Chat](#chat)
- [Summary](#summary)
- [Internal](#internal)

## Base URL
All API endpoints are relative to the base URL:
```
https://your-api-domain.com/api
```

## Authentication

The system uses JWT (JSON Web Token) authentication. Include the JWT in the Authorization header for protected routes:
```
Authorization: Bearer <token>
```

### Register a New User
```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or user already exists
- `500 Server Error`: Server error

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid credentials
- `500 Server Error`: Server error

### Get Current User
```
GET /auth/user
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `500 Server Error`: Server error

## Topics

### Create a New Topic
```
POST /topics
```

**Request Body:**
```json
{
  "name": "Climate Change",
  "keywords": ["global warming", "climate crisis", "greenhouse gas"],
  "description": "Monitoring news about climate change and related policies"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change",
    "keywords": ["global warming", "climate crisis", "greenhouse gas"],
    "description": "Monitoring news about climate change and related policies",
    "user": "60d21b4667d0d8992e610c85",
    "isActive": true,
    "scheduleId": "news-scraper-60d21b4667d0d8992e610c85-a1b2c3d4",
    "createdAt": "2023-06-01T12:00:00.000Z",
    "updatedAt": "2023-06-01T12:00:00.000Z"
  },
  "schedule": {
    "success": true,
    "scheduleId": "news-scraper-60d21b4667d0d8992e610c85-a1b2c3d4",
    "scheduleArn": "arn:aws:scheduler:us-east-1:123456789012:schedule/news-scraper-60d21b4667d0d8992e610c85-a1b2c3d4"
  },
  "initialScrape": {
    "success": true,
    "newArticles": 5,
    "processedArticles": 10
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or topic already exists
- `401 Unauthorized`: Invalid or missing token
- `500 Server Error`: Server error

### Get All Topics
```
GET /topics
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "topics": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "name": "Climate Change",
      "keywords": ["global warming", "climate crisis"],
      "description": "Monitoring climate change news",
      "user": "60d21b4667d0d8992e610c85",
      "isActive": true,
      "scheduleId": "news-scraper-60d21b4667d0d8992e610c85-a1b2c3d4",
      "createdAt": "2023-06-01T12:00:00.000Z",
      "updatedAt": "2023-06-01T12:30:00.000Z"
    },
    {
      "id": "60d21b4667d0d8992e610c86",
      "name": "Artificial Intelligence",
      "keywords": ["AI", "machine learning"],
      "description": "Monitoring AI news",
      "user": "60d21b4667d0d8992e610c85",
      "isActive": true,
      "scheduleId": "news-scraper-60d21b4667d0d8992e610c86-e5f6g7h8",
      "createdAt": "2023-06-02T12:00:00.000Z",
      "updatedAt": "2023-06-02T12:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `500 Server Error`: Server error

### Get a Topic by ID
```
GET /topics/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change",
    "keywords": ["global warming", "climate crisis"],
    "description": "Monitoring climate change news",
    "user": "60d21b4667d0d8992e610c85",
    "isActive": true,
    "scheduleId": "news-scraper-60d21b4667d0d8992e610c85-a1b2c3d4",
    "createdAt": "2023-06-01T12:00:00.000Z",
    "updatedAt": "2023-06-01T12:30:00.000Z"
  },
  "stats": {
    "newsCount": 25,
    "lastUpdated": "2023-06-01T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Update a Topic
```
PUT /topics/:id
```

**Request Body:**
```json
{
  "name": "Climate Change and Global Warming",
  "keywords": ["global warming", "climate crisis", "greenhouse gas", "carbon emissions"],
  "description": "Updated description for monitoring climate change news",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change and Global Warming",
    "keywords": ["global warming", "climate crisis", "greenhouse gas", "carbon emissions"],
    "description": "Updated description for monitoring climate change news",
    "user": "60d21b4667d0d8992e610c85",
    "isActive": true,
    "scheduleId": "news-scraper-60d21b4667d0d8992e610c85-a1b2c3d4",
    "createdAt": "2023-06-01T12:00:00.000Z",
    "updatedAt": "2023-06-01T13:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or failed to activate topic
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Delete a Topic
```
DELETE /topics/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Topic deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Manually Trigger News Scraping
```
POST /topics/:id/scrape
```

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change",
    "keywords": ["global warming", "climate crisis"],
    "description": "Monitoring climate change news",
    "user": "60d21b4667d0d8992e610c85",
    "isActive": true,
    "scheduleId": "news-scraper-60d21b4667d0d8992e610c85-a1b2c3d4",
    "createdAt": "2023-06-01T12:00:00.000Z",
    "updatedAt": "2023-06-01T12:30:00.000Z"
  },
  "scrapeResult": {
    "success": true,
    "newArticles": 3,
    "processedArticles": 10
  }
}
```

**Error Responses:**
- `400 Bad Request`: Topic is inactive
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

## News

### Get News for a Topic
```
GET /news/topic/:topicId
```

**Query Parameters:**
- `sentiment` (string, optional): Filter by sentiment (positive, neutral, negative)
- `from` (string, optional): Start date in ISO format (YYYY-MM-DD)
- `to` (string, optional): End date in ISO format (YYYY-MM-DD)
- `source` (string, optional): Filter by source name
- `sortBy` (string, optional): Sort by field ('publishedAt' or 'sentiment')
- `page` (number, optional): Page number for pagination
- `limit` (number, optional): Number of results per page

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "news": [
    {
      "id": "60d21b4667d0d8992e610d85",
      "topic": "60d21b4667d0d8992e610c85",
      "title": "New Climate Policy Announced",
      "description": "Government announces new climate policy details",
      "content": "The detailed content of the news article...",
      "url": "https://example.com/news/climate-policy",
      "source": {
        "name": "Example News",
        "url": "https://example.com"
      },
      "publishedAt": "2023-06-01T10:00:00.000Z",
      "summary": "Government announces new comprehensive climate policy with targets for carbon reduction by 2030.",
      "sentiment": {
        "score": 0.6,
        "magnitude": 0.8,
        "label": "positive"
      },
      "keywords": ["policy", "climate", "carbon", "reduction"],
      "scrapedAt": "2023-06-01T10:30:00.000Z"
    },
    {
      "id": "60d21b4667d0d8992e610d86",
      "topic": "60d21b4667d0d8992e610c85",
      "title": "Climate Change Effects on Agriculture",
      "description": "Study shows climate change impact on crops",
      "content": "The detailed content of the news article...",
      "url": "https://example.com/news/climate-agriculture",
      "source": {
        "name": "Example News",
        "url": "https://example.com"
      },
      "publishedAt": "2023-06-01T09:00:00.000Z",
      "summary": "New study indicates significant reduction in crop yields due to changing climate patterns.",
      "sentiment": {
        "score": -0.4,
        "magnitude": 0.7,
        "label": "negative"
      },
      "keywords": ["agriculture", "climate", "crops", "study"],
      "scrapedAt": "2023-06-01T09:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Get Sentiment Analysis for a Topic
```
GET /news/sentiment/:topicId
```

**Query Parameters:**
- `timeframe` (string, optional): Timeframe for analysis ('24h', '7d', '30d')

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "sentiment": {
    "timeframe": "7d",
    "dailySentiment": [
      {
        "_id": "2023-06-01",
        "sentiments": [
          {
            "label": "positive",
            "count": 5,
            "avgScore": 0.65
          },
          {
            "label": "neutral",
            "count": 3,
            "avgScore": 0.1
          },
          {
            "label": "negative",
            "count": 2,
            "avgScore": -0.55
          }
        ]
      },
      {
        "_id": "2023-06-02",
        "sentiments": [
          {
            "label": "positive",
            "count": 3,
            "avgScore": 0.58
          },
          {
            "label": "neutral",
            "count": 4,
            "avgScore": 0.05
          },
          {
            "label": "negative",
            "count": 3,
            "avgScore": -0.62
          }
        ]
      }
    ],
    "overallSentiment": [
      {
        "_id": "positive",
        "count": 12,
        "avgScore": 0.63
      },
      {
        "_id": "neutral",
        "count": 8,
        "avgScore": 0.08
      },
      {
        "_id": "negative",
        "count": 5,
        "avgScore": -0.59
      }
    ],
    "topKeywords": [
      {
        "_id": "climate",
        "count": 15
      },
      {
        "_id": "policy",
        "count": 10
      },
      {
        "_id": "carbon",
        "count": 8
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Get a Single News Article
```
GET /news/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "news": {
    "id": "60d21b4667d0d8992e610d85",
    "topic": "60d21b4667d0d8992e610c85",
    "title": "New Climate Policy Announced",
    "description": "Government announces new climate policy details",
    "content": "The detailed content of the news article...",
    "url": "https://example.com/news/climate-policy",
    "source": {
      "name": "Example News",
      "url": "https://example.com"
    },
    "publishedAt": "2023-06-01T10:00:00.000Z",
    "summary": "Government announces new comprehensive climate policy with targets for carbon reduction by 2030.",
    "sentiment": {
      "score": 0.6,
      "magnitude": 0.8,
      "label": "positive"
    },
    "keywords": ["policy", "climate", "carbon", "reduction"],
    "scrapedAt": "2023-06-01T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not authorized to access this news
- `404 Not Found`: News article not found
- `500 Server Error`: Server error

### Search News
```
GET /news/search/:topicId
```

**Query Parameters:**
- `query` (string, required): Search query
- `page` (number, optional): Page number for pagination
- `limit` (number, optional): Number of results per page

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "query": "carbon tax",
  "results": [
    {
      "id": "60d21b4667d0d8992e610d85",
      "topic": "60d21b4667d0d8992e610c85",
      "title": "New Carbon Tax Policy Announced",
      "description": "Government announces new carbon tax policy details",
      "content": "The detailed content of the news article...",
      "url": "https://example.com/news/carbon-tax-policy",
      "source": {
        "name": "Example News",
        "url": "https://example.com"
      },
      "publishedAt": "2023-06-01T10:00:00.000Z",
      "summary": "Government announces new carbon tax with rates starting at $20 per ton.",
      "sentiment": {
        "score": 0.2,
        "magnitude": 0.5,
        "label": "neutral"
      },
      "keywords": ["policy", "carbon tax", "government"],
      "scrapedAt": "2023-06-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing search query
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Get News Statistics
```
GET /news/stats/:topicId
```

**Query Parameters:**
- `days` (number, optional): Number of days for statistics (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "timeframe": "30 days",
  "stats": {
    "totalArticles": 87,
    "timeframeArticles": 52,
    "sentimentDistribution": [
      {
        "_id": "positive",
        "count": 28,
        "avgScore": 0.65
      },
      {
        "_id": "neutral",
        "count": 15,
        "avgScore": 0.05
      },
      {
        "_id": "negative",
        "count": 9,
        "avgScore": -0.58
      }
    ],
    "sourceDistribution": [
      {
        "_id": "Example News",
        "count": 15
      },
      {
        "_id": "Climate Reporter",
        "count": 12
      },
      {
        "_id": "Science Daily",
        "count": 10
      }
    ],
    "articlesPerDay": [
      {
        "_id": "2023-06-01",
        "count": 5
      },
      {
        "_id": "2023-06-02",
        "count": 3
      },
      {
        "_id": "2023-06-03",
        "count": 7
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

## Chat

### Get Chat History
```
GET /chat/topic/:topicId/history
```

**Query Parameters:**
- `page` (number, optional): Page number for pagination
- `limit` (number, optional): Number of messages per page

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "chatHistory": [
    {
      "id": "60d21b4667d0d8992e610e85",
      "topic": "60d21b4667d0d8992e610c85",
      "user": "60d21b4667d0d8992e610c75",
      "role": "user",
      "content": "What are the latest developments in climate policy?",
      "timestamp": "2023-06-01T12:00:00.000Z"
    },
    {
      "id": "60d21b4667d0d8992e610e86",
      "topic": "60d21b4667d0d8992e610c85",
      "user": "60d21b4667d0d8992e610c75",
      "role": "assistant",
      "content": "Based on recent news, there have been several significant developments in climate policy. The government announced a new carbon tax starting at $20 per ton, with plans to increase it over the next five years. Additionally, there's a new initiative for renewable energy subsidies and stricter regulations on industrial emissions announced last week.",
      "timestamp": "2023-06-01T12:00:15.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Send Message to Chat
```
POST /chat/topic/:topicId
```

**Request Body:**
```json
{
  "message": "What are the latest trends in renewable energy?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "message": {
    "id": "60d21b4667d0d8992e610e87",
    "topic": "60d21b4667d0d8992e610c85",
    "user": "60d21b4667d0d8992e610c75",
    "role": "user",
    "content": "What are the latest trends in renewable energy?",
    "timestamp": "2023-06-01T13:00:00.000Z"
  },
  "response": {
    "id": "60d21b4667d0d8992e610e88",
    "topic": "60d21b4667d0d8992e610c85",
    "user": "60d21b4667d0d8992e610c75",
    "role": "assistant",
    "content": "Based on recent news articles about climate change, several trends in renewable energy are emerging. Solar power costs continue to decrease, making it increasingly competitive with fossil fuels. Offshore wind projects are scaling up significantly, especially in coastal regions. Battery storage technology is improving rapidly, addressing intermittency issues. Green hydrogen is gaining attention as a potential solution for industrial processes and long-term energy storage. Additionally, there's increasing investment in grid modernization to accommodate distributed renewable energy sources.",
    "timestamp": "2023-06-01T13:00:15.000Z"
  },
  "timestamp": "2023-06-01T13:00:15.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing message
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Clear Chat History
```
DELETE /chat/topic/:topicId/history
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Chat history cleared successfully",
  "deleted": 10
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

## Summary

### Get Topic Summary
```
GET /summary/topic/:topicId
```

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "summary": {
    "id": "60d21b4667d0d8992e610f85",
    "topic": "60d21b4667d0d8992e610c85",
    "summary": "Climate change policy has seen significant developments in recent weeks. The government has announced a new carbon tax framework that will begin with a rate of $20 per ton and gradually increase over the next five years. This comes alongside new initiatives for renewable energy subsidies, particularly for solar and wind projects. \n\nScientific reports continue to highlight the urgency of addressing climate change, with recent studies indicating accelerated ice melt in polar regions and increasing frequency of extreme weather events. The agricultural sector is beginning to implement adaptation strategies in response to changing climate patterns that are affecting crop yields.\n\nInternational cooperation on climate action has strengthened, with several major economies announcing more ambitious emission reduction targets. Corporate sustainability initiatives are also expanding, with more companies pledging carbon neutrality by 2030 or 2050. Public awareness and concern about climate issues remain high, with climate considerations increasingly influencing consumer and voting behavior.",
    "keyInsights": [
      "New carbon tax framework starting at $20 per ton announced",
      "Renewable energy subsidies expanding, especially for solar and wind",
      "Recent studies show accelerated ice melt and extreme weather events",
      "Agricultural sector implementing climate adaptation strategies",
      "Major economies announcing more ambitious emission reduction targets",
      "Corporate carbon neutrality pledges increasing",
      "Public climate concern influencing consumer and voting behavior"
    ],
    "trendingThemes": [
      {
        "theme": "Carbon pricing mechanisms",
        "relevance": 9
      },
      {
        "theme": "Renewable energy expansion",
        "relevance": 8
      },
      {
        "theme": "Climate impact on agriculture",
        "relevance": 7
      },
      {
        "theme": "Corporate sustainability initiatives",
        "relevance": 6
      }
    ],
    "sentimentOverview": {
      "positive": 35,
      "neutral": 45,
      "negative": 20,
      "overall": "Cautiously optimistic with focused concern on specific impacts"
    },
    "createdAt": "2023-06-01T10:00:00.000Z",
    "updatedAt": "2023-06-01T16:00:00.000Z"
  },
  "isUpdating": false,
  "lastUpdated": "2023-06-01T16:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Error retrieving summary
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

### Generate New Topic Summary
```
POST /summary/topic/:topicId/generate
```

**Response (200 OK):**
```json
{
  "success": true,
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "summary": {
    "id": "60d21b4667d0d8992e610f85",
    "topic": "60d21b4667d0d8992e610c85",
    "summary": "Climate change discussions have intensified in recent weeks with several policy announcements and scientific developments. The most significant policy change is the introduction of a comprehensive carbon tax structure that will be implemented gradually over the next five years, starting at $20 per ton. This is accompanied by expanded subsidies for renewable energy projects, particularly targeting solar installations and offshore wind farms.\n\nThe scientific community has released concerning new data on the accelerating rate of polar ice melt and the increasing frequency of extreme weather events linked to climate change. These findings have prompted urgent calls for more ambitious climate action from leading environmental organizations and research institutions.\n\nThe agricultural sector is actively developing adaptation strategies as climate change affects growing seasons and crop yields. New drought-resistant crop varieties and water conservation techniques are being implemented in vulnerable regions. International climate diplomacy has seen renewed momentum with several countries upgrading their emissions reduction commitments ahead of the next major climate summit.\n\nCorporate climate initiatives have expanded notably, with major companies in the energy, transportation, and manufacturing sectors announcing carbon neutrality targets. Public engagement with climate issues remains high, reflected in consumer preferences for sustainable products and political support for climate-focused policies.",
    "keyInsights": [
      "Carbon tax structure beginning at $20/ton announced with 5-year implementation plan",
      "Expanded renewable energy subsidies for solar and wind projects",
      "New scientific data shows accelerating polar ice melt",
      "Agricultural sector developing climate adaptation strategies",
      "Several countries have upgraded emissions reduction commitments",
      "Major corporations announcing carbon neutrality targets",
      "Consumer preference for sustainable products increasing"
    ],
    "trendingThemes": [
      {
        "theme": "Carbon pricing policies",
        "relevance": 9
      },
      {
        "theme": "Renewable energy expansion",
        "relevance": 8
      },
      {
        "theme": "Climate science developments",
        "relevance": 8
      },
      {
        "theme": "Agricultural adaptation",
        "relevance": 7
      },
      {
        "theme": "Corporate climate initiatives",
        "relevance": 6
      }
    ],
    "sentimentOverview": {
      "positive": 30,
      "neutral": 50,
      "negative": 20,
      "overall": "Primarily informative and balanced with both concern about impacts and optimism about solutions"
    },
    "createdAt": "2023-06-01T10:00:00.000Z",
    "updatedAt": "2023-06-01T17:30:00.000Z"
  },
  "message": "Summary generated successfully",
  "newsAnalyzed": 15
}
```

**Error Responses:**
- `400 Bad Request`: Error generating summary
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

## Internal

These routes are for internal use by the AWS Lambda function and are secured with an API key.

### Trigger News Scraping (Lambda Endpoint)
```
POST /internal/scrape
```

**Request Body:**
```json
{
  "topicId": "60d21b4667d0d8992e610c85",
  "apiKey": "your_internal_api_key"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "News scraping completed for topic: Climate Change",
  "topic": {
    "id": "60d21b4667d0d8992e610c85",
    "name": "Climate Change"
  },
  "result": {
    "success": true,
    "newArticles": 4,
    "processedArticles": 12
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing topicId
- `401 Unauthorized`: Invalid API key
- `404 Not Found`: Topic not found
- `500 Server Error`: Server error

## Health Check

### Check API Health
```
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2023-06-01T12:00:00.000Z"
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "Detailed error information (only in development mode)"
}
```

Common HTTP status codes:
- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `500 Server Error`: Internal server error

## Authentication Flow

1. **Register a new user** using `/auth/register`
2. **Login** using `/auth/login`
3. **Store the JWT token** received in the response
4. **Include the token** in the Authorization header for all protected routes:
   ```
   Authorization: Bearer <token>
   ```

## Topic Workflow

1. **Create a topic** using `POST /topics`
2. **Wait for initial scraping** to complete
3. **Get news for the topic** using `GET /news/topic/:topicId`
4. **View sentiment analysis** using `GET /news/sentiment/:topicId`
5. **Chat with the AI** about the topic using `POST /chat/topic/:topicId`
6. **View topic summary** using `GET /summary/topic/:topicId`
7. **Manually trigger scraping** when needed using `POST /topics/:id/scrape`
8. **Update or delete the topic** as needed
