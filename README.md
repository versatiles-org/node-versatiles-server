[![Code Coverage](https://codecov.io/gh/versatiles-org/node-versatiles-server/branch/main/graph/badge.svg?token=IDHAI13M0K)](https://codecov.io/gh/versatiles-org/node-versatiles-server)
[![GitHub Workflow Status)](https://img.shields.io/github/actions/workflow/status/versatiles-org/node-versatiles-server/ci.yml)](https://github.com/versatiles-org/node-versatiles-server/actions/workflows/ci.yml)

# VersaTiles - Server

A Node.js server for [VersaTiles containers](https://github.com/versatiles-org/versatiles-spec).

## Install globally

```bash
npm i -g @versatiles/server
```

## Run

```bash
versatiles-server --help
```

This will show you how to use the server with all options and arguments.

For example:

```bash
versatiles-server planet.versatiles
```

## Options

<!--- This chapter is generated automatically --->

```console
$ versatiles-server
Usage: versatiles-server [options] <source>

Simple VersaTiles server

Arguments:
  source                   VersaTiles container, can be a URL or filename of a
                           "*.versatiles" file

Options:
  -b, --base-url <url>     Base URL for the server (default:
                           "http://localhost:<port>/")
  -c, --compress           Reduces traffic by recompressing data, but responses
                           take longer. Perfect if behind CDN.
  -h, --host <hostnameip>  Hostname or IP to bind the server to (default:
                           "0.0.0.0")
  -o, --open               Open map in web browser
  -p, --port <port>        Port to bind the server to (default: 8080)
  -q, --quiet              be quiet
  -s, --static <folder>    Path to a folder with static files
  -t, --tms                Use TMS tile order (flip y axis)
  -v, --verbose            be verbose
  --help                   display help for command
```

## Dependency Graph

<!--- This chapter is generated automatically --->

```mermaid
flowchart TB

subgraph 0["src"]
1["index.ts"]
subgraph 2["lib"]
3["log.ts"]
4["server.ts"]
5["file.ts"]
6["mime_types.ts"]
7["layer.ts"]
8["style.ts"]
9["response.ts"]
A["compressors.ts"]
B["types.ts"]
end
end
1-->3
1-->4
4-->5
4-->7
4-->3
4-->9
5-->6
6-->3
7-->8
9-->A
9-->3

style 0 fill-opacity:0.2
style 2 fill-opacity:0.2
```

## License

[Unlicense](./LICENSE.md)
