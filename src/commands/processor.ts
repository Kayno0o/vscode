import type { KCommand } from '../types'
import * as path from 'node:path'
import * as vscode from 'vscode'
import { createAndOpenPhpFile, getMessagePath, getStatePath } from '../utils/file'
import input from '../utils/input'

export default <KCommand>{
  callback: async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open')
      return
    }

    const result = await input({
      entityName: {
        prompt: 'Enter the entity name',
        required: true,
        title: 'Entity Name',
      },
      processorName: {
        prompt: 'Enter the processor name without the Processor suffix',
        required: true,
        title: 'Processor Name',
      },
    })

    if (result instanceof Error) {
      return
    }

    let { entityName, processorName } = result

    processorName = processorName.replace(/Processor$/, '')

    const folderPath = workspaceFolders[0].uri.fsPath

    const commandName = `Process${processorName}Command`

    const statePath = await getStatePath(folderPath)

    // ! PROCESSOR
    await createAndOpenPhpFile(path.join(statePath, entityName, `${processorName}Processor.php`), `
use ApiPlatform\\Metadata\\Operation;
use App\\ApiResource\\State\\AbstractStateProcessor;
use App\\Entity\\User;
use App\\Entity\\${entityName};
use App\\Command\\${entityName}\\${commandName};

/**
 * @extends AbstractStateProcessor<${entityName}, ${entityName}>
 */
final class ${processorName}Processor extends AbstractStateProcessor
{
    /**
     * @param ${entityName} $data
     *
     * @return ${entityName}
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ${entityName}
    {
      return $this->executeCommand(new ${commandName}(data: $data, uriVariables: $uriVariables));
    }
}
`)

    const messagePath = await getMessagePath(folderPath)

    // ! COMMAND
    await createAndOpenPhpFile(path.join(messagePath, 'Command', entityName, `${commandName}.php`), `
use App\\Entity\\${entityName};

final readonly class ${commandName}
{
    public function __construct(
        public ${entityName} $data,
        public array $uriVariables,
    ) {
    }
}
`)

    // ! COMMAND HANDLER
    await createAndOpenPhpFile(path.join(messagePath, 'Command', entityName, `${commandName}Handler.php`), `
use App\\Entity\\${entityName};
use Symfony\\Component\\Messenger\\Attribute\\AsMessageHandler;

#[AsMessageHandler]
final readonly class ${commandName}Handler
{
    public function __construct(
    ) {
    }

    public function __invoke(${commandName} $command): void
    {
    }
}
`)
  },
  name: 'processor',
}
