# reflekt

> Git mirror manager with transformation hooks

**Reflekt** is a powerful command-line tool designed to manage Git repository mirrors with the ability to apply transformation hooks during the mirroring process. It enables users to maintain synchronized copies of Git repositories while allowing for custom modifications, patches, and automated repository creation across different Git hosting platforms.

## Features

- **Complete Repository Mirroring**: Clone and mirror entire repositories including all branches and tags
- **Patch Application**: Apply custom patches to repositories during the mirroring process using base64-encoded patches
- **GitHub Integration**: Automatically create destination repositories on GitHub with proper authentication
- **Force Push Support**: Override existing repositories when needed with the `--force` option
- **Multi-Branch Support**: Automatically tracks and mirrors all remote branches
- **Docker Support**: Run reflekt in containerized environments with Docker and Docker Compose
- **Comprehensive Testing**: Well-tested with Jest for reliability

## Installation

### Prerequisites

- Node.js (v18 or higher)
- Git
- Docker (optional, for containerized usage)

### Local Installation

```bash
# Clone the repository
git clone https://forgejo.sovereign.zue.dev/zuedev/reflekt.git
cd reflekt

# Install dependencies
npm install

# Run the tool
npm start -- --help
```

## Usage

### Basic Mirroring

```bash
# Mirror a repository
npm start -- mirror <source-repo> <destination-repo>

# Example
npm start -- mirror https://github.com/user/source-repo.git https://github.com/user/dest-repo.git
```

### Advanced Options

```bash
# Force overwrite destination repository
npm start -- mirror --force <source> <destination>

# Apply a patch during mirroring
npm start -- mirror --apply-patch <base64-encoded-patch> <source> <destination>

# Create GitHub repository automatically
npm start -- mirror --github-create-repo --github-token <token> <source> <destination>

# Combine options
npm start -- mirror --force --github-create-repo --github-token <token> <source> <destination>
```

### Docker Usage

```bash
# Build the Docker image
npm run docker:build

# Run with Docker
npm run docker:run -- mirror <source> <destination>

# Run with Docker Compose
docker-compose run --rm reflekt mirror <source> <destination>

# Example with environment variables
GITHUB_TOKEN=your_token docker-compose run --rm reflekt mirror \
  --github-create-repo --github-token "$GITHUB_TOKEN" \
  https://github.com/source/repo.git \
  https://github.com/dest/repo.git
```

## Development

### Project Structure

```
reflekt/
├── source/           # Main application code
│   ├── main.js      # CLI application entry point
│   └── main.test.js # Integration tests
├── temp/            # Temporary directories for git operations
├── tests/           # Additional test files
├── Dockerfile       # Docker container configuration
├── docker-compose.yml # Docker Compose setup
└── package.json     # Node.js project configuration
```

### Development Setup

The primary source of truth for development of this project is [forgejo.sovereign.zue.dev/zuedev/reflekt](https://forgejo.sovereign.zue.dev/zuedev/reflekt). This repository is mirrored to various Git hosting services to test reflekt's own mirroring capabilities through [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food).

```bash
# Install development dependencies
npm install

# Run tests
npm test

# Format code
npx prettier --write .
```

### Technology Stack

- **Runtime**: [Node.js](https://nodejs.org/) with ES modules
- **CLI Framework**: [Commander.js](https://github.com/tj/commander.js) for command-line interface
- **Git Operations**: Node.js [child_process](https://nodejs.org/api/child_process.html) module for Git command execution
- **Testing**: [Jest](https://jestjs.io/) for unit and integration testing
- **Containerization**: Docker and Docker Compose for portable deployment

### Testing

The project includes comprehensive tests covering:

- Basic repository mirroring functionality
- Force push operations
- Patch application during mirroring
- Error handling and edge cases

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## API Reference

### CLI Commands

#### `mirror <source> <destination>`

Mirror a Git repository from source to destination.

**Options:**

- `--force` - Force overwrite of destination repository if it exists
- `--apply-patch <patch>` - Apply a base64-encoded patch to the repository before pushing
- `--github-create-repo` - Create the destination repository on GitHub if it doesn't exist
- `--github-token <token>` - GitHub token for authentication when creating repositories

**Examples:**

```bash
# Basic mirror
reflekt mirror https://github.com/user/repo.git ./local-mirror.git

# Mirror with patch and GitHub repo creation
reflekt mirror \
  --apply-patch "ZGlmZiAtLWdpdCBhL05FV19GSUxFLnR4dCBiL05FV19GSUxFLnR4dA==" \
  --github-create-repo \
  --github-token "ghp_xxxxxxxxxxxx" \
  https://github.com/source/repo.git \
  https://github.com/dest/repo.git
```

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.
