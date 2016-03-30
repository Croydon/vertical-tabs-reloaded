"use strict";

var EXPORTED_SYMBOLS = ["dragover", "dragend", "handleEvent"];

var XMLscope = this;

function handleEvent(aEvent)
{
	switch (aEvent.type) {
		case "load":
			XMLscope.updateVisibility();
			break;

		case "resize":
			if (aEvent.target != window) {
			break; }

			TabsInTitlebar.updateAppearance();

			var width = XMLscope.mTabstrip.boxObject.width;
			var height = XMLscope.mTabstrip.boxObject.height;
			if ((!XMLscope._verticalTabs && width != XMLscope.mTabstripWidth) ||
			(XMLscope._verticalTabs && height != XMLscope.mTabstripHeight))
			{
				XMLscope.adjustTabstrip();
				XMLscope._fillTrailingGap();
				XMLscope._handleTabSelect();
				XMLscope.mTabstripWidth = width;
				XMLscope.mTabstripHeight = height;
			}

			XMLscope.tabbrowser.updateWindowResizers();
			break;

		case "mouseout":
			// If the "related target" (the node to which the pointer went) is not
			// a child of the current document, the mouse just left the window.
			let relatedTarget = aEvent.relatedTarget;
			if (relatedTarget && relatedTarget.ownerDocument == document)
			break;

		case "mousemove":
			if (document.getElementById("tabContextMenu").state != "open")
			XMLscope._unlockTabSizing();
			break;
	}
}

function dragover(event)
{
	console.log("dragover event fired");
	
	var effects = XMLscope._getDropEffectForTabDrag(event);

	var ind = XMLscope._tabDropIndicator;
	if (effects == "" || effects == "none") {
		ind.collapsed = true;
		return;
	}

	console.log(effects);
	event.preventDefault();
	event.stopPropagation();

	var tabStrip = XMLscope.mTabstrip;
	var verticalTabs = XMLscope._verticalTabs;
	var ltr = verticalTabs || (window.getComputedStyle(this, null).direction == "ltr");

	// autoscroll the tab strip if we drag over the scroll
	// buttons, even if we aren't dragging a tab, but then
	// return to avoid drawing the drop indicator
	var pixelsToScroll = 0;
	if (XMLscope.getAttribute("overflow") == "true") {
		var targetAnonid = event.originalTarget.getAttribute("anonid");
		switch (targetAnonid) {
			case "scrollbutton-up":
				pixelsToScroll = tabStrip.scrollIncrement * -1;
				break;
			case "scrollbutton-down":
				pixelsToScroll = tabStrip.scrollIncrement;
				break;
		}
		if (pixelsToScroll)
			tabStrip.scrollByPixels((ltr ? 1 : -1) * pixelsToScroll);
	}

	if (effects == "move" &&
		this == event.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0).parentNode) {
		console.log("animateTabMove!");
		ind.collapsed = true;
		XMLscope._animateTabMove(event);
		return;
	}

	XMLscope._finishAnimateTabMove();

	if (effects == "link") {
		let tab = XMLscope._getDragTargetTab(event, true);
		if (tab) {
			if (!XMLscope._dragTime)
				XMLscope._dragTime = Date.now();
			if (Date.now() >= XMLscope._dragTime + XMLscope._dragOverDelay)
				XMLscope.selectedItem = tab;
				ind.collapsed = true;
				return;
		}
	}

	var rect = tabStrip.getBoundingClientRect();
	var newMargin;
	if (pixelsToScroll) {
		// if we are scrolling, put the drop indicator at the edge
		// so that it doesn't jump while scrolling
		let scrollRect = tabStrip.scrollClientRect;

		if (verticalTabs) {
			let minMargin = scrollRect.top - rect.top;
			let maxMargin = Math.min(minMargin + scrollRect.height, scrollRect.bottom);
			newMargin = (pixelsToScroll > 0) ? maxMargin : minMargin;
		} else {
			let minMargin = scrollRect.left - rect.left;
			let maxMargin = Math.min(minMargin + scrollRect.width, scrollRect.right);
			if (!ltr)
			[minMargin, maxMargin] = [XMLscope.clientWidth - maxMargin,
									XMLscope.clientWidth - minMargin];
			newMargin = (pixelsToScroll > 0) ? maxMargin : minMargin;
		}
	}
	else {
		let newIndex = XMLscope._getDropIndex(event, effects == "link");
		if (newIndex == XMLscope.childNodes.length) {
				let tabRect = XMLscope.childNodes[newIndex-1].getBoundingClientRect();
			if (verticalTabs)
				newMargin = tabRect.bottom - rect.top;
			else if (ltr)
				newMargin = tabRect.right - rect.left;
			else
				newMargin = rect.right - tabRect.left;
		}
		else {
			let tabRect = XMLscope.childNodes[newIndex].getBoundingClientRect();
			if (verticalTabs)
				newMargin = tabRect.top - rect.top;
			else if (ltr)
				newMargin = tabRect.left - rect.left;
			else
				newMargin = rect.right - tabRect.right;
		}
	}

	ind.collapsed = false;

	if (verticalTabs)
		newMargin += ind.clientHeight / 2;
	else
		newMargin += ind.clientWidth / 2;

	if (!ltr)
		newMargin *= -1;

	ind.style.transform = "translate(" + Math.round(newMargin) + "px)";
	if (verticalTabs)
		ind.style.marginTop = (-ind.clientHeight) + "px";
	else
		ind.style.MozMarginStart = (-ind.clientWidth) + "px";
}

function dragend(event)
{
	console.log("dragend event fired!");
	// Note: while this case is correctly handled here, this event
	// isn't dispatched when the tab is moved within the tabstrip,
	// see bug 460801.

	XMLscope._finishAnimateTabMove();

	var dt = event.dataTransfer;
	var draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
	if (dt.mozUserCancelled || dt.dropEffect != "none" || XMLscope._isCustomizing) {
		delete draggedTab._dragData;
		return;
	}

	// Disable detach within the browser toolbox
	var eX = event.screenX;
	var eY = event.screenY;
	var wX = window.screenX;
	var wY = window.screenY;

	if (XMLscope._verticalTabs) {
		// check if the drop point is horizontally within the window
		if (eY > wY && eY < (wY + window.outerHeight)) {
			let bo = XMLscope.mTabstrip.boxObject;
			// also avoid detaching if the the tab was dropped too close to
			// the tabbar (half a tab)
			let endScreenX = bo.screenX + 1.5 * bo.width;
			if (eX < endScreenX && eX > window.screenX)
				return;
		}
	} else {
	  // check if the drop point is horizontally within the window
		if (eX > wX && eX < (wX + window.outerWidth)) {
			let bo = XMLscope.mTabstrip.boxObject;
			// also avoid detaching if the the tab was dropped too close to
			// the tabbar (half a tab)
			let endScreenY = bo.screenY + 1.5 * bo.height;
			if (eY < endScreenY && eY > window.screenY)
				return;
		}
	}

	// screen.availLeft et. al. only check the screen that this window is on,
	// but we want to look at the screen the tab is being dropped onto.
	var sX = {}, sY = {}, sWidth = {}, sHeight = {};
	Cc["@mozilla.org/gfx/screenmanager;1"]
	  .getService(Ci.nsIScreenManager)
	  .screenForRect(eX, eY, 1, 1)
	  .GetAvailRect(sX, sY, sWidth, sHeight);
	// ensure new window entirely within screen
	var winWidth = Math.min(window.outerWidth, sWidth.value);
	var winHeight = Math.min(window.outerHeight, sHeight.value);
	var left = Math.min(Math.max(eX - draggedTab._dragData.offsetX, sX.value),
						sX.value + sWidth.value - winWidth);
	var top = Math.min(Math.max(eY - draggedTab._dragData.offsetY, sY.value),
					   sY.value + sHeight.value - winHeight);

	delete draggedTab._dragData;

	if (XMLscope.tabbrowser.tabs.length == 1) {
		// resize _before_ move to ensure the window fits the new screen.  if
		// the window is too large for its screen, the window manager may do
		// automatic repositioning.
		window.resizeTo(winWidth, winHeight);
		window.moveTo(left, top);
		window.focus();
	} else {
		XMLscope.tabbrowser.replaceTabWithWindow(draggedTab, { screenX: left, screenY: top, });
	}
	event.stopPropagation();
}

function _getDropIndex(event, isLink)
{
	console.log("function _getDropIndex called!");
	let verticalTabs = XMLscope._verticalTabs;

	var tabs = XMLscope.childNodes;
	var tab = XMLscope._getDragTargetTab(event, isLink);
	if (verticalTabs) {
		for (let i = tab ? tab._tPos : 0; i < tabs.length; i++)
			if (event.screenY < tabs[i].boxObject.screenY + tabs[i].boxObject.height / 2)
			return i;
	} else if (window.getComputedStyle(this, null).direction == "ltr") {
		for (let i = tab ? tab._tPos : 0; i < tabs.length; i++)
			if (event.screenX < tabs[i].boxObject.screenX + tabs[i].boxObject.width / 2)
			return i;
	} 
	else 
	{
		for (let i = tab ? tab._tPos : 0; i < tabs.length; i++)
			if (event.screenX > tabs[i].boxObject.screenX + tabs[i].boxObject.width / 2)
			return i;
	}
	
	return tabs.length;
}

function _positionPinnedTabs()
{
	let verticalTabs = XMLscope._verticalTabs;

	var numPinned = XMLscope.tabbrowser._numPinnedTabs;
	var doPosition = XMLscope.getAttribute("overflow") == "true" && numPinned > 0;

	if (doPosition) {
		XMLscope.setAttribute("positionpinnedtabs", "true");

		if (verticalTabs) {
			let scrollButtonHeight = XMLscope.mTabstrip._scrollButtonDown.getBoundingClientRect().height;
			let paddingStart = XMLscope.mTabstrip._scrollbox.style.paddingTop;
			let height = 0;

			for (let i = numPinned - 1; i >= 0; i--) {
				let tab = XMLscope.childNodes[i];
				height += tab.getBoundingClientRect().height;
				tab.style.marginTop = - (height + scrollButtonHeight + paddingStart) + "px";
			}

			XMLscope.style.paddingTop = height + paddingStart + "px";
		} else {
			let scrollButtonWidth = XMLscope.mTabstrip._scrollButtonDown.getBoundingClientRect().width;
			let paddingStart = XMLscope.mTabstrip.scrollboxPaddingStart;
			let width = 0;

			for (let i = numPinned - 1; i >= 0; i--) {
				let tab = XMLscope.childNodes[i];
				width += tab.getBoundingClientRect().width;
				tab.style.MozMarginStart = - (width + scrollButtonWidth + paddingStart) + "px";
			}

			XMLscope.style.MozPaddingStart = width + paddingStart + "px";
		}
	} 
	else 
	{	
		XMLscope.removeAttribute("positionpinnedtabs");

		if (verticalTabs) {
			for (let i = 0; i < numPinned; i++) {
				let tab = XMLscope.childNodes[i];
				tab.style.marginTop = "";
			}

			XMLscope.style.paddingTop = "";
		} else {
			for (let i = 0; i < numPinned; i++) {
				let tab = XMLscope.childNodes[i];
				tab.style.MozMarginStart = "";
			}

			XMLscope.style.MozPaddingStart = "";
		}
	}

	if (XMLscope._lastNumPinned != numPinned) {
		XMLscope._lastNumPinned = numPinned;
		XMLscope._handleTabSelect(false);
	}	
}

function _animateTabMove(event)
{
	let draggedTab = event.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);

	if (XMLscope.getAttribute("movingtab") != "true") {
		XMLscope.setAttribute("movingtab", "true");
		XMLscope.selectedItem = draggedTab;
	}

	if (!("animLastScreenPos" in draggedTab._dragData)) {
		// XXX verticalTabs hack -- this isn't set on dragstart (only screenX is),
		// but we can fake it here.  We also call scrollX scrollPosition.
		draggedTab._dragData.screenY = event.screenY;
		draggedTab._dragData.scrollPos = draggedTab._dragData.scrollX;
		draggedTab._dragData.animLastScreenPos = draggedTab._dragData.screenY;
	}

	let screenPos = event.screenY;
	if (screenPos == draggedTab._dragData.animLastScreenPos)
	return;

	let draggingForward = screenPos > draggedTab._dragData.animLastScreenPos;
	draggedTab._dragData.animLastScreenPos = screenPos;

	// TODO: FIXME: Why is RTL hardcoded?
	let rtl = false; //(window.getComputedStyle(this).direction == "rtl");
	let pinned = draggedTab.pinned;
	let numPinned = XMLscope.tabbrowser._numPinnedTabs;
	let tabs = XMLscope.tabbrowser.visibleTabs
							.slice(pinned ? 0 : numPinned,
								   pinned ? numPinned : undefined);
	if (rtl)
	tabs.reverse();
	let tabSize = draggedTab.getBoundingClientRect().height;

	// Move the dragged tab based on the mouse position.

	let leftTab = tabs[0];
	let rightTab = tabs[tabs.length - 1];
	let tabScreenPos = draggedTab.boxObject.screenY;
	
	console.log("tabScreenPos", tabScreenPos);
	
	let translateVal = screenPos - draggedTab._dragData.screenY;
	
	console.log("translateVal 1", translateVal);
	
	if (!pinned)
	translateVal += XMLscope.mTabstrip.scrollPosition - draggedTab._dragData.scrollX; // XXX verticalTabs always scrollX here, it's actually the scrollPosition
	let minBound = leftTab.boxObject.screenY - tabScreenPos;
	let maxBound = (rightTab.boxObject.screenY + rightTab.boxObject.height) -
				   (tabScreenPos + tabSize);
	translateVal = Math.max(translateVal, minBound);
	translateVal = Math.min(translateVal, maxBound);
	draggedTab.style.transform = "translateY(" + translateVal + "px)";
	
	console.log("draggedTab transform: " + draggedTab.style.transform + " should be " + "translateY(" + translateVal + "px)");

	// Determine what tab we're dragging over.
	// * Point of reference is the center of the dragged tab. If that
	//   point touches a background tab, the dragged tab would take that
	//   tab's position when dropped.
	// * We're doing a binary search in order to reduce the amount of
	//   tabs we need to check.

	let tabCenter = tabScreenPos + translateVal + tabSize / 2;
	let newIndex = -1;
	let oldIndex = "animDropIndex" in draggedTab._dragData ?
				 draggedTab._dragData.animDropIndex : draggedTab._tPos;
	let low = 0;
	let high = tabs.length - 1;
	while (low <= high) {
	let mid = Math.floor((low + high) / 2);
	if (tabs[mid] == draggedTab &&
		++mid > high)
		break;
	let boxObject = tabs[mid].boxObject;
	let screenPos = boxObject.screenY + getTabShift(tabs[mid], oldIndex);
	if (screenPos > tabCenter) {
		high = mid - 1;
	} else if (screenPos + boxObject.height < tabCenter) {
		low = mid + 1;
	} else {
		newIndex = tabs[mid]._tPos;
		break;
	}
	}
	if (newIndex >= oldIndex)
	newIndex++;
	if (newIndex < 0 || newIndex == oldIndex)
	return;
	draggedTab._dragData.animDropIndex = newIndex;

	// Shift background tabs to leave a gap where the dragged tab
	// would currently be dropped.

	for (let tab of tabs) {
		if (tab != draggedTab) {
			let shift = getTabShift(tab, newIndex);
			tab.style.transform = shift ? "translateY(" + shift + "px)" : "";
		}
	}
	
	function getTabShift(tab, dropIndex) {
		if (tab._tPos < draggedTab._tPos && tab._tPos >= dropIndex)
			return rtl ? -tabSize : tabSize;
		if (tab._tPos > draggedTab._tPos && tab._tPos < dropIndex)
			return rtl ? tabSize : -tabSize;
		return 0;
	}		
}

