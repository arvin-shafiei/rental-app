# Contributing to Rental App

Thank you for your interest in contributing to Rental App! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

Before creating a bug report:

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/rental-app/issues)
2. Check if the bug still exists in the latest version

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, browser, etc.)
- **Error messages** or logs

### Suggesting Features

Feature suggestions are welcome! When suggesting a feature:

1. Check if the feature has already been suggested
2. Provide a clear description of the feature
3. Explain the use case and benefits
4. Consider implementation complexity

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/rental-app.git
   cd rental-app
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write clear, self-documenting code
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Test locally in development mode
   - Ensure no TypeScript errors
   - Check that existing functionality still works

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```
   
   Use clear commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Wait for code review

## Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Naming**: Use descriptive names, follow camelCase for variables/functions, PascalCase for components/classes
- **Formatting**: Use consistent indentation (2 spaces)
- **Comments**: Add comments for complex logic, not obvious code

### Project Structure

- **Backend**: Follow the existing structure in `backend/src/`
  - Controllers handle HTTP requests/responses
  - Services contain business logic
  - Routes define API endpoints
  - Middleware handles authentication/validation

- **Frontend**: Follow Next.js App Router conventions
  - Pages in `app/` directory
  - Reusable components in `components/`
  - Utilities in `lib/`
  - Types in `types/`

### Environment Variables

- **Never commit** `.env` files or actual secrets
- Use `.env.example` files as templates
- Document new environment variables in README.md

### Database Changes

- Create migration files in `backend/src/db/migrations/`
- Name migrations sequentially: `XXX_description.sql`
- Test migrations on a development database first
- Include rollback instructions if possible

### Testing

- Write tests for new features (when test framework is set up)
- Test edge cases and error conditions
- Ensure backward compatibility

### Documentation

- Update README.md if adding new features
- Add JSDoc comments for public functions
- Update API documentation for new endpoints

## Review Process

1. **Automated Checks**: PRs must pass CI checks (if configured)
2. **Code Review**: At least one maintainer will review your PR
3. **Feedback**: Address any requested changes
4. **Merge**: Once approved, your PR will be merged

## Questions?

- Open an issue for questions
- Check existing documentation
- Review existing code for examples

Thank you for contributing! 🎉

