<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#f9f9f9" id="bodyTable">
	<tbody>
		<tr>
			<td style="padding-right:10px;padding-left:10px;" align="center" valign="top" id="bodyCell">
				<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperWebview" style="max-width:600px">
					<tbody>
					<tr>
						<td align="center" valign="top">
							<table border="0" cellpadding="0" cellspacing="0" width="100%">
								<tbody>
								<tr>
									<td style="padding-top: 20px; padding-bottom: 20px; padding-right: 0px;" align="right" valign="middle" class="webview">
										<a href="#" style="color:#bbb;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:right;text-decoration:underline;padding:0;margin:0"
										   target="_blank" class="text hideOnMobile"></a>
									</td>
								</tr>
								</tbody>
							</table>
						</td>
					</tr>
					</tbody>
				</table>
				<table border="0" cellpadding="0" cellspacing="0" class="wrapperBody" style="max-width:600px">
					<tbody style="width:100%; text-align:center;">
					<tr style="width:100%; text-align:center;">
						<td align="center" style="width:100%; text-align:center;" valign="top">
							<table border="0" style="width:100%"  cellpadding="0" cellspacing="0" width="100%" class="tableCard" style="background-color:#fff;border-color:#e5e5e5;border-style:solid;border-width:0 1px 1px 1px;">
								<tbody style="width:100%">
									<tr>
										<td style="background-color:#8b1602;font-size:1px;line-height:3px" class="topBorder" height="3">&nbsp;</td>
									</tr>
									<tr style="width:100%; text-align:center;">
										<td style="padding-top: 60px; padding-bottom: 20px;" align="center" valign="middle" class="emailLogo">
											<a href="#" style="text-decoration:none" target="_blank">
												<img alt="" border="0" src="<?=base_url()?>assets/images/solfilm.png" style="width:100%;max-width:200px;height:auto;display:block" width="200">
											</a>
										</td>
									</tr>
									<tr>
										<td style="padding-bottom: 20px;" align="center" valign="top" class="imgHero">

										</td>
									</tr>
									<tr>
										<td style="padding-bottom: 5px; padding-left: 20px; padding-right: 20px;" align="center" valign="top" class="mainTitle">
											<h2 class="text" style="color:#000;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:28px;font-weight:500;font-style:normal;letter-spacing:normal;line-height:36px;text-transform:none;text-align:center;padding:0;margin:0">Order Summary</h2>
										</td>
									</tr>
									<tr style="width:100%; text-align:center;">
										<td style="padding-left:20px;padding-right:20px" align="center" valign="top" class="containtTable ui-sortable">
											<table border="0" cellpadding="0" cellspacing="0" class="tableButton" style="width:100%; ; text-align:left;">
												<tbody>
													<?php if (isset($makeAndModels[0])): ?>
														<tr>
															<td>Make and Model: </td>
															<td><?php echo $makeAndModels[0];?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($customMakeAndModelComment)): ?>
														<tr>
															<td>Comment to make and model: </td>
															<td><?php echo $customMakeAndModelComment;?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($scheduledTime)): ?>
														<tr>
															<td>Scheduled Time: </td>
															<td><?php echo $scheduledTime;?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($price)): ?>
														<tr>
															<td>Price: </td>
															<td><?php echo $price;?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($workDuration)): ?>
														<tr>
															<td>Work Duration: </td>
															<td><?php echo $workDuration;?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($edgeFittings[0])): ?>
														<tr>
															<td>Edge Fittings: </td>
															<td><?php echo $edgeFittings[0];?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($paintProtections[0])): ?>
														<tr>
															<td>Paint Protections: </td>
															<td><?php echo $paintProtections[0];?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($shades[0])): ?>
														<tr>
															<td>Shades: </td>
															<td><?php echo $shades[0];?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($customWindows[0])): ?>
														<tr>
															<td>Custom Windows: </td>
															<td><?php echo $customWindows[0];?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($deliveryAddress)): ?>
														<tr>
															<td>Delivery Address: </td>
															<td><?php echo $deliveryAddress;?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($requisitionNumber)): ?>
														<tr>
															<td>Requisition Number: </td>
															<td><?php echo $requisitionNumber;?></td>
														</tr>
													<?php endif; ?>
													<?php if (isset($salesman)): ?>
														<tr>
															<td>Salesman: </td>
															<td><?php echo $salesman;?></td>
														</tr>
													<?php endif; ?>

													<?php if (isset($additionalComments)): ?>
														<tr>
															<td>Additional Comments: </td>
															<td><?php echo $additionalComments;?></td>
														</tr>
													<?php endif; ?>
												</tbody>
											</table>
										</td>
									</tr>
									<tr>
										<td style="font-size:1px;line-height:1px" height="20">&nbsp;</td>
									</tr>
								</tbody>
							</table>
							<table border="0" cellpadding="0" cellspacing="0" width="100%" class="space">
								<tbody>
								<tr>
									<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
								</tr>
								</tbody>
							</table>
						</td>
					</tr>
					</tbody>
				</table>
				<table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapperFooter" style="max-width:600px">
					<tbody>
					<tr>
						<td align="center" valign="top">
							<table border="0" cellpadding="0" cellspacing="0" width="100%" class="footer">
								<tbody>

								<tr>
									<td style="padding: 10px 10px 5px;" align="center" valign="top" class="brandInfo">
										<p class="text" style="color:#666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:center;padding:0;margin:0">
											Disclaimer: This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to
											whom they are addressed. If you have received this email in error please notify the system manager.</p>
									</td>
								</tr>
								<tr>
									<td style="padding: 10px 10px 5px;" align="center" valign="top" class="brandInfo">
										<p class="text" style="color:#666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:center;padding:0;margin:0">Copyright © <?php echo date("Y"); ?> Solfilm.dk - All Rights Reserved.</p>
									</td>
								</tr>

								<tr>
									<td style="padding: 0px 10px 10px;" align="center" valign="top" class="footerEmailInfo">
										<p class="text" style="color:#666;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;font-style:normal;letter-spacing:normal;line-height:20px;text-transform:none;text-align:center;padding:0;margin:0">If you have any questions please contact us <a href="#" style="color:#0f6cb2;text-decoration:underline" target="_blank">booking@solfilm.dk.</a>
										</p>
									</td>
								</tr>
								<tr>
									<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
								</tr>
								</tbody>
							</table>
						</td>
					</tr>
					<tr>
						<td style="font-size:1px;line-height:1px" height="30">&nbsp;</td>
					</tr>
					</tbody>
				</table>
			</td>
		</tr>
	</tbody>
</table>
