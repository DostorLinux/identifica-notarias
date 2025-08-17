#!/bin/bash
for i in $(ls images/); do
    extension=$(echo $i | cut -d '.' -f 2)
    nombre=$(echo $i | cut -d '.' -f 1)
    if [ $extension == 'png' ]; then
       convert images/$i images/$nombre.jpg
       rm images/$i
    elif [ $extension == 'jpg' ]; then
       true
    elif [ $extension == 'JPG' ]; then
       mv images/$i images/$nombre.jpg
    elif [ $extension == 'jpeg' ]; then
       mv images/$i images/$nombre.jpg
   elif [ $extension == 'pdf' ]; then
       convert images/$i images/$nombre.jpg
    else
       true
    fi
done
