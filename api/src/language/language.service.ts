import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LanguageDTO, LanguageStatusUpdateDTO } from './language.model';
import { LanguageJsonType } from '../utils/app.model';
@Injectable()
export class LanguageService {
    constructor(
        @InjectModel('Language') private readonly languageModel: Model<any>) {
    }

    // Check JON
    public async checkJson(sourceKey, inputKey) {
        console.log("sourceKey", sourceKey);
        console.log("inputKey", inputKey);
        let allFounded = sourceKey.filter(ai => !inputKey.includes(ai));
        console.log("inputKey", inputKey);

        if (allFounded && allFounded.length) {
            let str = "";
            allFounded.forEach((element, index) => {
                if (index > 0) str += "," + element;
                else str += element;
            });
            return { isValid: false, message: str };
        } else return { isValid: true, message: "Success" };
    }

    // validate JSON
    public async validateJson(sourcData, inputData, type) {
        let sourceKey, inputKey;

        if (type === LanguageJsonType.BACKEND) {
            sourceKey = Object.keys(sourcData.backendJson);
            inputKey = Object.keys(inputData.backendJson);
        } else if (type === LanguageJsonType.DELIVERY) {
            sourceKey = Object.keys(sourcData.deliveyAppJson);
            inputKey = Object.keys(inputData.deliveyAppJson);
        } else if (type === LanguageJsonType.WEB) {
            sourceKey = Object.keys(sourcData.webJson);
            inputKey = Object.keys(inputData.webJson);
        } else if (type === LanguageJsonType.USER) {
            sourceKey = Object.keys(sourcData.mobAppJson);
            inputKey = Object.keys(inputData.mobAppJson);
        } else if (type === LanguageJsonType.CMS) {
            sourceKey = Object.keys(sourcData.cmsJson);
            inputKey = Object.keys(inputData.cmsJson);
        }


        let isValidated = await this.checkJson(sourceKey, inputKey);
        return isValidated;
    }

    // Parse json
    public parseJson(sourcData) {
        sourcData.webJson = JSON.parse(sourcData.webJson);
        sourcData.deliveyAppJson = JSON.parse(sourcData.deliveyAppJson);
        sourcData.mobAppJson = JSON.parse(sourcData.mobAppJson);
        sourcData.cmsJson = JSON.parse(sourcData.cmsJson);
        sourcData.backendJson = JSON.parse(sourcData.backendJson);
        return sourcData;
    }

    public async getAllLanguage(): Promise<Array<LanguageDTO>> {
        let languages = await this.languageModel.find({}, 'languageCode languageName status isDefault');
        return languages;
    }

    public async getAllLanguageForUser(): Promise<Array<LanguageDTO>> {
        let languages = await this.languageModel.find({ status: true }, 'languageCode languageName isDefault');
        return languages;
    }

    public async checkExistLanguage(code: string): Promise<LanguageDTO> {
        let language = await this.languageModel.findOne({ languageCode: code }, '_id');
        return language;
    }

    public async getLanguageById(id: string): Promise<LanguageDTO> {
        let language = await this.languageModel.findOne({ _id: id });
        return language;
    }

    public async getLanguageByCode(code: string): Promise<LanguageDTO> {
        let language = await this.languageModel.findOne({ languageCode: code });
        return language;
    }

    public async getDefaultLanguage(): Promise<LanguageDTO> {
        let language = await this.languageModel.findOne({ isDefault: 1 });
        return language;
    }

    // Create Language
    public async createLanguage(languageData: LanguageDTO): Promise<LanguageDTO> {
        const language = await this.languageModel.create(languageData);
        return language;
    }

    // Update Language
    public async updateLanguage(languageId: string, languageData: LanguageDTO): Promise<LanguageDTO> {
        const language = await this.languageModel.findByIdAndUpdate(languageId, languageData, { new: true });
        return language;
    }

    public async deleteLanguage(languageId: string): Promise<any> {
        return await this.languageModel.deleteOne({ _id: languageId });
    }

    // Set Default Language
    public async setDefaultLanguage(languageId: string): Promise<LanguageDTO> {
        await this.languageModel.updateMany({}, { isDefault: 0 });
        const language = await this.languageModel.findByIdAndUpdate(languageId, { isDefault: 1 }, { new: true });
        return language;
    }

    // Enable Disable Language
    public async languageStatusUpdate(languageId: string, languageStatusUpdateDTO: LanguageStatusUpdateDTO): Promise<LanguageDTO> {
        const language = await this.languageModel.findByIdAndUpdate(languageId, languageStatusUpdateDTO, { new: true });
        return language;
    }

    public async getLanguageForBackend(): Promise<Array<LanguageDTO>> {
        let language = await this.languageModel.find({}, 'languageCode languageName backendJson');
        return language;
    }

    // Get other language except en
    public async getOtherLanguage(): Promise<Array<LanguageDTO>> {
        let language = await this.languageModel.find({ languageCode: { $ne: "en" } });
        return language;
    }
    // language key-value update 
    public async languageJsonUpdate(languageKeys, englishLanguage, jsonSourceKey, jsonType) {
        let jsonTargetKey = Object.keys(languageKeys[jsonType]);
        // console.log("jsonTargetKey", languageKeys.languageCode, jsonType);
        let allFounded = jsonSourceKey.filter(ai => !jsonTargetKey.includes(ai));
        if (allFounded && allFounded.length) {
            for (let keys of allFounded) {
                // console.log("allFounded", englishLanguage[jsonType][keys])
                languageKeys[jsonType][keys] = englishLanguage[jsonType][keys]
            }
        }
        return languageKeys[jsonType]
    }

    // update other language background process
    public async addKeyToOtherLanguage(englishLanguage): Promise<any> {
        let otherLanguages = await this.getOtherLanguage();
        let backendJsonSourceKey = Object.keys(englishLanguage.backendJson);
        let mobAppJsonSourceKey = Object.keys(englishLanguage.mobAppJson);
        let deliveyAppJsonSourceKey = Object.keys(englishLanguage.deliveyAppJson);
        let webJsonSourceKey = Object.keys(englishLanguage.webJson);
        let cmsJsonSourceKey = Object.keys(englishLanguage.backendJson);
        for (let languageKeys of otherLanguages) {
            let allJson = await Promise.all([
                this.languageJsonUpdate(languageKeys, englishLanguage, backendJsonSourceKey, LanguageJsonType.BACKEND),
                this.languageJsonUpdate(languageKeys, englishLanguage, mobAppJsonSourceKey, LanguageJsonType.USER),
                this.languageJsonUpdate(languageKeys, englishLanguage, deliveyAppJsonSourceKey, LanguageJsonType.DELIVERY),
                this.languageJsonUpdate(languageKeys, englishLanguage, webJsonSourceKey, LanguageJsonType.WEB),
                this.languageJsonUpdate(languageKeys, englishLanguage, cmsJsonSourceKey, LanguageJsonType.CMS)
            ]);
            languageKeys[LanguageJsonType.BACKEND] = allJson[0];
            languageKeys[LanguageJsonType.USER] = allJson[1];
            languageKeys[LanguageJsonType.DELIVERY] = allJson[2];
            languageKeys[LanguageJsonType.WEB] = allJson[3];
            languageKeys[LanguageJsonType.CMS] = allJson[4];
            // console.log("languageKeys", JSON.stringify(languageKeys))
            await this.updateLanguage(languageKeys._id, languageKeys);
        }
        return true;
    }
}