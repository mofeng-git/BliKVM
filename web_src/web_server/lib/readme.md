# update ventoy to latest
Download from https://github.com/ventoy/Ventoy/releases. Find `tool/VentoyWorker.sh`, find the following content and add comments.The purpose is to eliminate interaction.
```
    # vtwarn "Attention:"
    # vtwarn "You will install Ventoy to $DISK."
    # vtwarn "All the data on the disk $DISK will be lost!!!"
    # echo ""

    # read -p 'Continue? (y/n) '  Answer
    # if [ "$Answer" != "y" ]; then
        # if [ "$Answer" != "Y" ]; then
            # exit 0
        # fi
    # fi

    # echo ""
    # vtwarn "All the data on the disk $DISK will be lost!!!"
    # read -p 'Double-check. Continue? (y/n) '  Answer
    # if [ "$Answer" != "y" ]; then
        # if [ "$Answer" != "Y" ]; then
            # exit 0
        # fi
    # fi
```
