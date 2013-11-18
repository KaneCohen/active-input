# Active Input

## Add a live feedback and character counter to your input elements and forms
Enable submit button on form data change, enable button only when minimum number
of characters has been typed in textarea element.

````html
<div class="liveInput">
	<input class="text" type="text">
	<span class="counter"></span>
	<button type="button">Save</button>
</div>
````

Now that we have HTML, we initialize the plugin:

````javascript
$('.liveInput').activeInput({
	minChars:  5,
	counter: $('.liveInput .counter')
});
````

After initialization. If input element has less then 5 characters, button will be disabled.
If you enter more then 4 characters, button will be enabled.

If activeInput has been applied to other elements such as select or input checkbox, then plugin
will be looking if the element value has been changed since initialization.

-----

## Options

minChars:  1,  // Equals or more
stripHtml: false,
button:    null, // null or element
counter:   null,
input:     null, // null, element, array of elements
form:      null,

`minChars: 1` (default) Numer of characters that has to be in input element or textarea to enable a button.

`stripHtml: false` (default). Should counter strip html elements when counting number of characters in the field?

`button: null` (default). Which button has to be enabled/disabled on input update.

`form: null` (default). Listen to form data update. If anything's been changed, button will be enabled.

`input: null || jQuery element || array of input elements`. Indicate which element is being tracked by activeInput.
If set to null, plugin will look for the first input || textarea element in the element it's been applied to.
If set to jQuery object, it'll listen to this element's update. Could be set to multiple elements.
If set to array, then that array must have the following structure:
````js
[{
	input: element,
	minChars: 1,
	maxChars: null,
	counter: element,
	stripHtml: false
}]
````
