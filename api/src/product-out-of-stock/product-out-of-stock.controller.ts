import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ProductOutOfStockService } from './product-out-of-stock.service';
import { ApiOperation, ApiImplicitQuery, ApiResponse, ApiBearerAuth, ApiUseTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../utils/jwt.strategy';
import { UsersDTO } from '../users/users.model';
import { OrderFilterQuery } from 'src/order/order.model';
import { ResponseErrorMessage, CommonResponseModel, AdminSettings, AdminQuery } from '../utils/app.model';
import { StockVariantDTO } from './product-out-of-stock.model';
import { UtilService } from '../utils/util.service';

@Controller('product-out-of-stock')
@ApiUseTags('Product Out of Stock')
export class ProductOutOfStockController {

	constructor(
		private productOutOfStockService: ProductOutOfStockService,
		private utilService: UtilService,
	) { }

	@Get('/admin/list')
	@ApiOperation({ title: 'Get all list of Productstock' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of order ', type: StockVariantDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getList(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);

			const productStocklist = await Promise.all([
				this.productOutOfStockService.getAllList(pagination.page - 1, pagination.limit),
				this.productOutOfStockService.countAllList()
			])
			return this.utilService.successResponseData(productStocklist[0], { total: productStocklist[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

}
