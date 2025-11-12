# reflekt

> Git mirror manager with transformation hooks

**Reflekt** is a tool to manage Git mirrors with the ability to apply transformation hooks during the mirroring process. It is designed to help users maintain synchronized copies of Git repositories while allowing for custom modifications to the content depending on their target destination.

## Development

The primary source of truth for development of this project is [forgejo.sovereign.zue.dev/zuedev/reflekt](https://forgejo.sovereign.zue.dev/zuedev/reflekt), this will likely be moved to GitHub at a later date if the project gains more traction.

I mirror this repository to many other Git hosting services as a means to test the mirroring capabilities of reflekt itself through [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food).

The project uses the [Node.js](https://nodejs.org/) runtime and its [child_process](https://nodejs.org/api/child_process.html) module to interface with Git.
