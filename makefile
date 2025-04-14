package:
	rm -f *.vsix
	vsce package

install:
	-code --uninstall-extension kaynooo.kvsc
	code --install-extension *.vsix --force

package-install: package install
