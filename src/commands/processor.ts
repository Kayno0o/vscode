import * as vscode from 'vscode';
import * as path from 'path';
import { KCommand } from "../types";

const processor: KCommand = {
  name: 'processor',
  callback: async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    let entityName: string | undefined = undefined;

    do {
      entityName = await vscode.window.showInputBox({
        prompt: 'Enter the entity name',
        title: 'Entity Name',
      });
    } while (entityName === '');

    if (entityName === undefined) {
      return;
    }

    const processorName = await vscode.window.showInputBox({
      prompt: 'Enter the processor name without the Processor suffix',
      title: 'Processor Name',
    });

    if (processorName === undefined) {
      return;
    }

    const folderPath = workspaceFolders[0].uri.fsPath;
    const filePath = path.join(folderPath, 'src/ApiResource/State/', entityName, processorName + 'Processor.php');

    const uri = vscode.Uri.file(filePath);

    vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(
      `<?php

declare(strict_types=1);

namespace App\\ApiResource\\State${entityName ? `\\${entityName}` : ''};

use ApiPlatform\\Metadata\\Operation;
use App\\ApiResource\\State\\AbstractStateProcessor;
use App\\Entity\\User;
${entityName ? `use App\\Entity\\${entityName};\n` : ''}
/**
 * @extends AbstractStateProcessor<${entityName ?? 'Input'}, ${entityName ?? 'Ouput'}>
 */
class ${processorName} extends AbstractStateProcessor
{
    /**
     * @param ${entityName ?? 'Input'} $data
     *
     * @return ${entityName ?? 'Ouput'}
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ${entityName ?? 'Ouput'}
	  {
      $user = $this->security->getUser();
      if (!($user instanceof User)) {
          throw new AccessDeniedHttpException('Access denied');
      }

      $this->manager->persist($data);
      $this->manager->flush();

      return $data;
    }
}
`
    ));
  }
};

export default processor;