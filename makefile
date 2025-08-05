package:
	rm -f *.vsix
	bun run check
	vsce package
	cp kvsc*.vsix ~/zshrc/dotfiles/vscode/extensions

install:
	-code --uninstall-extension kaynooo.kvsc
	code --install-extension *.vsix --force

package-install: package install
