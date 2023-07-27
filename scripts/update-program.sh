#!/usr/bin/env bash

anchor build

anchor upgrade --program-id HgpmQVLjipSFXipjqfjkX2LLKRc8nKBktuEXjpeAqqbe target/deploy/roundie_to_round.so

cp ./target/types/* $HOME/the-roundies/marketing-site/lib
cp ./target/idl/* $HOME/the-roundies/marketing-site/lib
