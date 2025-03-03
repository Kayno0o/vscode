package:
	rm -f *.vsix
	vsce package

install:
	code --install-extension *.vsix

package-install: package install
