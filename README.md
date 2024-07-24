# Symfony VSCode Extension README

This is the README for the Symfony VSCode extension. This extension enhances your Symfony development experience by providing tools to create files and boilerplate code for API Platform, Symfony commands, providers, processors, actions, and more.

## Features

- **File Creation**: Quickly generate files for API Platform, Symfony commands, providers, processors, actions, and other components.
- **Boilerplate Code**: Automatically insert boilerplate code to speed up development.
- **Customizable Templates**: Customize code templates according to your project needs.

For example, here’s a screenshot showing how to create a new Symfony command file:

![Create Symfony Command](images/create-command.png)

## Requirements

To use this extension, you need:

- **Symfony**: Ensure you have Symfony installed and properly set up in your project.
- **API Platform**: Required if you’re working with API Platform components.
- **VS Code**: The extension requires Visual Studio Code.

## Extension Settings

This extension contributes the following settings:

* `symfonyExtension.enable`: Enable or disable the extension.
* `symfonyExtension.templatePath`: Set the path for custom templates.
* `symfonyExtension.defaultNamespace`: Define the default namespace for generated files.

## Known Issues

- **Template Customization**: Custom templates might not always render correctly if the syntax is invalid.
- **File Path Conflicts**: Ensure that generated files don’t overwrite existing ones unless intended.

## Release Notes

### 1.0.0

- Initial release with support for creating Symfony commands, providers, processors, actions, and API Platform files.

---

Feel free to adjust the content and images according to your extension's specific features and capabilities!
