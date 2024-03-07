# Create emails on build time - only replace prop slots for props

bugs:
- href="mailto: {props.email}" 
-> { href: "mailto: ", :  props.email }
Problem: ': {' is identified as prop separator

      // TODO: matchChar() should check if matching char is followed by `, ` or ` }`
      // TODO: if so, end the value there instead of at matching char...
      // TODO: e.g. 
      href="mailto: {props.email}"
      -> { href: "mailto:" + props.email }
      "mailto:" isn't a value cus not followed by ', ' or ' }'
      instead, value should end at next occurrence of ', ' or in this case ' }'
