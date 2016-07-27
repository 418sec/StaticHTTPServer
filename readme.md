# statichttpserver

StaticHTTPServer is inspired by [SimpleHTTPServer.py](https://docs.python.org/2/library/simplehttpserver.html#module-SimpleHTTPServer) and is intended to be a fast and easy to use static file server.

## Prerequisites

- Node.js v4.4.5 or greater

## Installation

    npm install -g statichttpserver

## Starting a server

   $ StaticHTTPServer

## Command Line Arguments

*All command line arguments are optional.*

| Argument | Description | Example |
| ----- | ------- | ----- |
| -p (--port) | Server port | ```StaticHTTPServer --port=12345``` |
| -i (--ip) | Server IP Address or Hostname | ```StaticHTTPServer --ip=localhost``` |
| -d (--directory) | Content Directory (default is the current directory) | ```StaticHTTPServer --directory=../Pictures``` |
| -h (--help) | Display these arguments | ```StaticHTTPServer --help``` |

## Development

 - Clone this repo
 - The goal of this project is quick installation and minimal (or no) run time dependencies.

## License

:copyright: 2016 Jason Benson.  Content licensed CC-BY-4.0; code licensed MIT.