# Contributing to Linkinator MCP Server

Thank you for your interest in contributing to the Linkinator MCP Server!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/linkinator-mcp.git
   cd linkinator-mcp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b my-feature
   ```

## Development Workflow

### Making Changes

1. Make your changes with tests
2. Ensure all tests pass:
   ```bash
   npm test
   ```
3. Ensure linting passes:
   ```bash
   npm run lint
   ```
4. Build the project:
   ```bash
   npm run build
   ```

### Code Style

This project uses Biome for linting and formatting. The code follows these conventions:
- Tabs for indentation
- Single quotes for strings
- Strict TypeScript with no `any` types
- Comprehensive test coverage

To automatically fix issues:
```bash
npm run fix
```

### Testing

- Write tests for new features
- Maintain or improve code coverage
- Tests are located in the `test/` directory
- Use Vitest for testing

### Commit Messages

Write clear, concise commit messages that describe the changes made.

## Submitting Changes

1. Push your changes to your fork
2. Submit a pull request to the main repository
3. Ensure CI checks pass
4. Wait for review

## Questions?

Feel free to open an issue for questions or discussions about contributing.
