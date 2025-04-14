import type { KCommand } from '../types'
import path from 'node:path'
import { toPascal } from '@kaynooo/utils'
import vscode from 'vscode'
import { createAndOpenPhpFile, getMessagePath, getStatePath } from '../utils/file'
import input from '../utils/input'
import { pathToUse } from '../utils/textUtils'

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
    entityName = toPascal(entityName)

    processorName = processorName.replace(/Processor$/, '')
    processorName = toPascal(processorName)

    const folderPath = workspaceFolders[0].uri.fsPath

    const commandName = `${processorName}Command`

    const statePath = await getStatePath(folderPath)
    const messagePath = await getMessagePath(folderPath)

    const processorPath = path.join(statePath, entityName, `${processorName}Processor.php`)
    const commandPath = path.join(messagePath, 'Command', entityName, `${commandName}.php`)
    const commandHandlerPath = path.join(messagePath, 'Command', entityName, `${commandName}Handler.php`)

    // ! PROCESSOR
    await createAndOpenPhpFile(processorPath, `
use ApiPlatform\\Metadata\\Operation;
use ${pathToUse(path.join(statePath, 'AbstractStateProcessor'))};
use App\\Entity\\User;
use App\\Entity\\${entityName};
use ${pathToUse(commandPath)};

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

    // ! COMMAND
    await createAndOpenPhpFile(commandPath, `
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
    await createAndOpenPhpFile(commandHandlerPath, `
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
