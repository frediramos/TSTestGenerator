#!/usr/bin/env bash
echo "Installing hooks..."
# this command creates symlink to our pre-commit script
ln -s scripts/pre-commit.sh .git/hooks/pre-commit
echo "Done!"