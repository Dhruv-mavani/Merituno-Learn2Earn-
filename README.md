# Merituno - Learning Management System

## Project Overview
Merituno is a comprehensive learning platform that combines skill development with career opportunities. The platform features a gamified learning experience, job matching, freelance projects, and a wallet system for financial transactions.

## Features

### 🎓 Learning Management
- **Interactive Learning Modules**: Structured courses with videos and quizzes
- **Gamified Experience**: XP rewards and star level progression
- **Skill Development**: Curated content for various technical skills
- **Progress Tracking**: Module completion and performance analytics

### 💼 Career Opportunities
- **Job Portal**: Full-time and part-time job listings
- **Freelance Marketplace**: Project-based work opportunities
- **Application Tracking**: Monitor job and freelance applications
- **Employer Communication**: Direct messaging with employers

### 💰 Wallet System
- **Financial Transactions**: Secure payment processing
- **Earnings Tracking**: Monitor income from completed work
- **Balance Management**: View transaction history and current balance
- **Admin Oversight**: Financial monitoring and user balance adjustments

### 👥 User Management
- **Role-based Access**: Candidate and employer accounts
- **Profile Management**: Skills, experience, and portfolio
- **Admin Dashboard**: Comprehensive user and content management

## Technology Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Firebase Authentication**
- **Firebase Firestore (Database)**
- **Firebase Storage**

### Styling
- **Custom CSS with CSS Grid & Flexbox**
- **Font Awesome Icons**
- **Google Fonts (Poppins)**

### Architecture
- **Modular JavaScript structure**
- **Responsive design**
- **Real-time data synchronization**

## Project Structure

```
merituno/
├── users/
│   ├── css/
│   │   ├── admin.css
│   │   └── users.css
│   └── js/
│       ├── member/
│       │   ├── main.js
│       │   ├── learning.js
│       │   ├── jobs.js
│       │   ├── freelance.js
│       │   └── wallet.js
│       └── admin/
│           ├── main.js
│           ├── users.js
│           ├── jobs.js
│           ├── freelance.js
│           ├── learning.js
│           └── wallet.js
├── login/
│   └── js/
│       └── auth.js
├── images/
│   └── logo.png
└── home-page/
    └── style.css
```

## Setup Instructions

### Prerequisites
- Firebase project with Authentication, Firestore, and Storage enabled
- Web server for hosting (local or production)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd merituno
   ```

2. **Configure Firebase**
   - Update Firebase configuration in `../login/js/auth.js`
   - Set up Firestore security rules
   - Configure Authentication providers

3. **Set up Firestore Collections**
   - `users` - User profiles and preferences
   - `learning_modules` - Course content and structure
   - `jobs` - Job listings and applications
   - `freelance_tasks` - Freelance projects and proposals
   - `transactions` - Financial transaction records
   - `candidateModules` - User learning progress

4. **Deploy to Web Server**
   - Upload all files to your web server
   - Ensure proper file permissions
   - Configure CORS if needed

## Firebase Configuration

### Required Firestore Collections

#### Users Collection
```javascript
{
  userId: string,
  email: string,
  role: "candidate" | "employer" | "admin",
  xp: number,
  starLevel: number,
  skills: array,
  experience: array,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

#### Learning Modules Collection
```javascript
{
  title: string,
  description: string,
  videos: array, // YouTube URLs
  quizQuestions: array,
  xpReward: number,
  skillTags: array,
  status: "active" | "inactive",
  createdAt: timestamp
}
```

#### Jobs Collection
```javascript
{
  title: string,
  description: string,
  requirements: array,
  salary: string,
  location: string,
  type: "full-time" | "part-time",
  status: "active" | "filled",
  employerId: string,
  createdAt: timestamp
}
```

## Development Guidelines

### Code Style
- Use meaningful variable and function names
- Follow consistent indentation (2 spaces)
- Comment complex logic
- Use ES6+ features where appropriate

### File Organization
- Keep CSS modular and component-focused
- Separate concerns in JavaScript files
- Use descriptive file names
- Group related functionality together

### Firebase Best Practices
- Implement proper security rules
- Use batch operations for multiple writes
- Implement pagination for large datasets
- Handle offline scenarios gracefully

## Deployment

### Production Checklist
- [ ] Firebase security rules configured
- [ ] All environment variables set
- [ ] Error handling implemented
- [ ] Performance optimized
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility verified

### Environment Setup
1. Production Firebase project
2. Custom domain (optional)
3. SSL certificate
4. CDN for static assets

## Git Commands

### Initial Setup
```bash
git init
git add .
git commit -m "Initial commit: Merituno LMS platform"
git branch -M main
git remote add origin <repository-url>
git push -u origin main
```

### Regular Development Workflow
```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/feature-name

# Create pull request on GitHub/GitLab
```

### Common Commands
```bash
# Check status
git status

# View commit history
git log --oneline

# Merge branches
git checkout main
git merge feature/feature-name

# Resolve conflicts (if any)
git mergetool
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is proprietary and confidential. All rights reserved.

## Support
For technical support or questions, contact the development team at [dev-team@merituno.com]

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Development Team
