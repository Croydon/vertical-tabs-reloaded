
SOURCES = \
	README.txt \
	bootstrap.js \
	chrome.manifest \
	groups.jsm \
	install.rdf \
	multiselect.jsm \
	options.xul \
	override-bindings.css \
	data/skin/base.css \
	data/skin/bindings.css \
	data/skin/groups.xml \
	data/skin/dark/dark.css \
	data/skin/light/light.css \
	data/skin/default/linux/linux.css \
	data/skin/default/osx/closetab-white.svg \
	data/skin/default/osx/closetab.svg \
	data/skin/default/osx/dropmarker.png \
	data/skin/default/osx/osx.css \
	data/skin/default/osx/twisty.png \
	data/skin/default/win7/dropmarker.png \
	data/skin/default/win7/twisty-collapsed.png \
	data/skin/default/win7/twisty.png \
	data/skin/default/win7/win7.css \
	tabdatastore.jsm \
	utils.js \
	vertical-tabbrowser.xml \
	verticaltabs.jsm \
	$(NULL)

all: VerticalTabs.xpi

VerticalTabs.xpi: $(SOURCES)
	rm -f ./$@
	zip -9r ./$@ $(SOURCES)
