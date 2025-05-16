# Contributing to AI Delivers Food! 🍕

Thank you for your interest in contributing to AI Delivers Food! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Git
- npm or yarn
- VS Code (recommended) or your preferred IDE

### Initial Setup
1. Fork and clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```
3. Set up environment variables (see README.md)

## Development Workflow

### 1. Branch Management
- `main` - Production-ready code
- `develop` - Development branch
- Feature branches: `feature/feature-name`
- Bug fix branches: `fix/bug-name`
- Hotfix branches: `hotfix/issue-name`

### 2. Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Follow the existing code structure and patterns
- Use meaningful variable and function names
- Add JSDoc comments for functions and classes

### 3. Commit Guidelines
Follow the Conventional Commits specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(auth): add email verification

- Add email verification endpoint
- Implement token generation
- Add email service integration

Closes #123
```

### 4. Testing
- Write tests for all new features
- Maintain minimum 80% test coverage
- Run tests before committing:
  ```bash
  npm test
  npm run test:coverage
  ```
- Update existing tests when modifying features

### 5. API Development
- Follow RESTful API design principles
- Document all endpoints using Swagger/OpenAPI
- Include request/response examples
- Add proper error handling
- Validate all inputs

### 6. Database
- Use Mongoose schemas for data modeling
- Include proper indexes
- Follow MongoDB best practices
- Add data validation
- Handle database errors appropriately

### 7. Security
- Never commit sensitive data
- Use environment variables for secrets
- Implement proper authentication
- Validate all user inputs
- Follow security best practices

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation for any new features
3. Ensure all tests pass
4. Request review from at least one maintainer
5. Address any review comments
6. Wait for approval before merging

## Code Review Guidelines

### What to Review
- Code functionality
- Test coverage
- Documentation
- Security considerations
- Performance impact
- Code style and consistency

### Review Process
1. Check if the code follows the project's style guide
2. Verify that all tests pass
3. Ensure proper error handling
4. Check for security vulnerabilities
5. Review documentation updates
6. Provide constructive feedback

## Development Tools

### Recommended VS Code Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- MongoDB for VS Code
- GitLens
- REST Client

### Useful Commands
```bash
# Run development server
npm run dev

# Run tests
npm test

# Check code style
npm run lint

# Build for production
npm run build

# Generate API documentation
npm run docs
```

## Getting Help

- Check existing issues and discussions
- Join our community chat
- Create a new issue for bugs
- Use the discussion forum for questions

## License

By contributing to AI Delivers Food!, you agree that your contributions will be licensed under the project's MIT License. 