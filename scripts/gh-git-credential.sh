#!/bin/bash
exec "$(dirname "$0")/../.bin/gh" auth git-credential "$@"
