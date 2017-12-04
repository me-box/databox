#!/usr/bin/env bash

function red {
  echo "\033[0;31m${1}\033[0m"
}

function green {
  echo "\033[0;32m${1}\033[0m"
}

function datef
{
  date +'%Y-%m-%d %H:%M:%S'
}

log() {
  echo "[$(datef) $ME]: $@"
}

err() {
  echo "[$(datef) $ME]: $@" >&2
}

die() {
  rc=$1
  shift
  err "$@"
  exit $rc
}

assert_or_die() {
  if [[ "$1" != "$2" ]]
  then
    die 1 "ERROR: ${3}"
  fi
}

function fail {
    echo -e "[$(datef) $ME]: ${1} \nERROR: ${2} $(red FAILED)"
    exit 1
}

function success {
    echo -e "[$(datef) $ME]: ${1} $(green OK)"
}

function test_assert {
  if [ "$1" != "$2" ]
  then
    fail "$3" "$1"
  else
    success "$3"
  fi
}
