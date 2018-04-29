#!/bin/bash
 
cd blib
for file in ../par_files/*.par;
do
  unzip -n $file;
done
