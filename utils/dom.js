"use strict";

/* global utils */

utils["dom"] = class DomUtils
{
    static isElementInVisibleArea(DOMElement)
    {
        let rect = DOMElement.getBoundingClientRect();

        if(rect.top >= 0
        && rect.left >= 0
        && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        && rect.right <= (window.innerWidth || document.documentElement.clientWidth))
        {
            return true;
        }

        return false;
    }
};
