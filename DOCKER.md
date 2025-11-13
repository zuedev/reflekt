# Docker Setup for Reflekt

This document explains how to use Reflekt with Docker.

## Building the Docker Image

To build the Docker image:

```bash
docker build -t reflekt .
```

Or use the npm script:

```bash
npm run docker:build
```

## Running with Docker

### Basic Usage

```bash
# Show help
docker run --rm reflekt

# Mirror a repository
docker run --rm -v $(pwd):/workspace -w /workspace reflekt mirror https://github.com/source/repo.git https://github.com/dest/repo.git
```

### Using Docker Compose

The included `docker-compose.yml` provides a convenient way to run Reflekt:

```bash
# Show help
docker-compose run --rm reflekt

# Mirror a repository
docker-compose run --rm reflekt mirror https://github.com/source/repo.git https://github.com/dest/repo.git

# Mirror with force and GitHub repository creation
GITHUB_TOKEN=your_token docker-compose run --rm reflekt mirror --force --github-create-repo --github-token "$GITHUB_TOKEN" https://github.com/source/repo.git https://github.com/dest/repo.git
```

### Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token for creating repositories

### Volume Mounts

The Docker setup mounts the current directory to `/workspace` to allow:

- Access to local repositories
- Storing temporary files in the `temp/` directory
- Reading patch files from the local filesystem

### Examples

1. **Simple mirror**:

   ```bash
   docker-compose run --rm reflekt mirror https://github.com/octocat/Hello-World.git https://github.com/yourusername/Hello-World-Mirror.git
   ```

2. **Mirror with force overwrite**:

   ```bash
   docker-compose run --rm reflekt mirror --force https://github.com/source/repo.git https://github.com/dest/repo.git
   ```

3. **Mirror with GitHub repository creation**:

   ```bash
   GITHUB_TOKEN=your_token docker-compose run --rm reflekt mirror --github-create-repo --github-token "$GITHUB_TOKEN" https://github.com/source/repo.git https://github.com/yourusername/new-repo.git
   ```

4. **Mirror with patch application**:
   ```bash
   # First encode your patch as base64
   PATCH_B64=$(base64 -i your-patch.diff)
   docker-compose run --rm reflekt mirror --apply-patch "$PATCH_B64" https://github.com/source/repo.git https://github.com/dest/repo.git
   ```

## Notes

- The Docker image is based on `node:20-alpine` and includes Git
- The working directory inside the container is `/app`
- Temporary files are stored in `/app/temp/` inside the container
- The application runs as the default user (node) for security
