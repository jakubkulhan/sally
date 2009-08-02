# Sally

Sally is Javascript library, which emulates some "advanced" CSS selectors (+, >, [attr]) for Microsoft Internet Explorer 6. Everything you have to do is write your HTML and CSS and then include into <head>:

    <script type="text/javascript" src="sally.js"></script>

That's all. Now all selectors in CSSes that [Sizzle](http://sizzlejs.com/) supports are supported. And you do not have to worry to write special code for MSIE 6.

## Issues

Because of lack of DOMSubtreeModified event in IE, `sally.update()` have to be called after each modification of DOM tree. "Interactive" CSS rules (currently only pseudo-class :hover) are not updated.

## Thanks goes to

- John Resig for Sizzle selector engine. 
- Peter-Paul Koch for [BrowserDetect](http://www.quirksmode.org/js/detect.html).
