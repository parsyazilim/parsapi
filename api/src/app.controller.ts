import { Controller } from '@nestjs/common';
import { UtilService } from './utils/util.service';
import { LanguageService } from './language/language.service';
@Controller()
export class AppController {
	constructor(private utilService: UtilService, private languageService: LanguageService) {
		this.languageService.getLanguageForBackend().then(data => this.utilService.setLanguageList(data));
		//this.utilService.cronForSubscription();
	}
}
