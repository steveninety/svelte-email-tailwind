<script lang="ts">
	import {
		Html,
		Head,
		Preview,
		Body,
		Container,
		Section,
		Row,
		Column,
		Heading,
		Text,
		Link,
		Button,
		Img,
		Hr
	} from '$lib';

	export let props = {
		email: '{ props.email }'
	};

	const baseUrl = '';

	const fontFamily = {
		fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif'
	};
</script>

<Html>
	<Head />
	<Preview preview="Apple Receipt" />
	<Body class="bg-white w-fit max-w-[660px] mx-auto" style={fontFamily}>
		<Container class="my-0 mx-auto p-[20px 0 48px]">
			<Section>
				<Column>
					<Img src={`${baseUrl}/apple-logo.png`} width="42" height="42" alt="Apple Logo" />
				</Column>
				<Column align="right" class="table-cell">
					<Text class="text-[32px] text-[#888888] font-[300]">Receipt</Text>
				</Column>
			</Section>
			<Section>
				<Column>
					<Text class="text-center m-[36px 0 40px 0] text-[14px] font-[500] text-[#111111]">
						Save 3% on all your Apple purchases with Apple Card.
						<sup class="font-300">1</sup>{' '}
						<Link href="https://www.apple.com/apple-card">Apply and use in minutes</Link>
						<sup class="font-300">2</sup>
					</Text>
				</Column>
			</Section>
			<Section
				class="border-collapse border-spacing-0 text-[rgb(51,51,51)] rounded-3 bg-[#efefef] text-[12px]"
			>
				<Row>
					<Column class="sm:w-full w-auto sm:block">
						<Section>
							<Row class="h-[46px]">
								<Column class="w-full p-3 border border-solid border-white border-collapse">
									<span class="text-[#666666] text-[10px]">APPLE ID</span>
									<br />
									<Link href={`mailto:${props.email}`}>{props.email}</Link>
								</Column>
							</Row>
							<Row class="h-[46px]">
								<Column class="p-3 border border-solid border-white border-collapse">
									<span class="text-[#666666] text-[10px]">DATE</span>
									<br />
									Jul 20, 2023
								</Column>
							</Row>
							<Row class="h-[46px]">
								<Column class="p-3 border border-solid border-white border-collapse">
									<span class="text-[#666666] text-[10px]">ORDER ID</span>
									<br />
									<Link
										href="https://support.apple.com/kb/HT204088?cid=email_receipt_itunes_article_HT204088"
									>
										ML4F5L8522
									</Link>
								</Column>
							</Row>
							<Row>
								<Column class="p-3 border border-solid border-white border-collapse">
									<span class="text-[#666666] text-[10px]">DOCUMENT NO.</span>
									<br />
									<Link href="">121565300446</Link>
								</Column>
							</Row>
						</Section>
					</Column>
					<Column
						class="sm:w-full w-auto sm:block border border-solid border-white border-collapse"
					>
						<Section>
							<Row>
								<Column class="p-3">
									<span class="text-[#666666] text-[10px]">BILLED TO</span>
									<br />
									Visa .... 7461 (Apple Pay)
									<br />
									Zeno Rocha
									<br />
									2125 Chestnut St
									<br />
									San Francisco, CA 94123
									<br />
									USA
								</Column>
							</Row>
						</Section>
					</Column>
				</Row>
			</Section>
			<Section class="text-[#666666] text-[10px] mt-[30px] mb-[15px] mx-0 h-[24px] bg-[#efefef]">
				<Text class="text-center pl-[10px] text-[14px] font-[500] m-0">App Store</Text>
			</Section>
			<Section>
				<Column class="sm:w-full w-auto sm:block">
					<Img
						src={`${baseUrl}/apple-hbo-max-icon.jpeg`}
						width="64"
						height="64"
						alt="HBO Max"
						class="ml-[20px] rounded-[14px] border border-solid border-[rgba(128,128,128,0.2)]"
					/>
				</Column>
				<Column class="sm:w-full w-auto sm:block sm:mt-[15px]">
					<Text class="leading-tight my-0 mx-[20px] w-full">
						<span dir="auto" class="text-[12px] font-[600]"> HBO Max: Stream TV &amp; Movies </span>
						<br />
						<span class="text-[12px] text-[#666666]"> HBO Max Ad-Free (Monthly) </span>
						<br />
						<span class="text-[12px] text-[#666666]">Renews Aug 20, 2023</span>
						<br />
						<Link
							href="https://userpub.itunes.apple.com/WebObjects/MZUserPublishing.woa/wa/addUserReview?cc=us&amp;id=1497977514&amp;o=i&amp;type=Subscription%20Renewal"
							class="text-[12px] text-[rgb(0,112,201)] underline-none"
							data-saferedirecturl="https://www.google.com/url?q=https://userpub.itunes.apple.com/WebObjects/MZUserPublishing.woa/wa/addUserReview?cc%3Dus%26id%3D1497977514%26o%3Di%26type%3DSubscription%2520Renewal&amp;source=gmail&amp;ust=1673963081204000&amp;usg=AOvVaw2DFCLKMo1snS-Swk5H26Z1"
						>
							Write a Review
						</Link>
						&nbsp;|&nbsp;<span>&nbsp;</span>
						<span>&nbsp;</span>
						<Link
							href="https://buy.itunes.apple.com/WebObjects/MZFinance.woa/wa/reportAProblem?a=1497977514&amp;cc=us&amp;d=683263808&amp;o=i&amp;p=29065684906671&amp;pli=29092219632071&amp;s=1"
							class="text-[12px] text-[rgb(0,112,201)] underline-none"
							data-saferedirecturl="https://www.google.com/url?q=https://buy.itunes.apple.com/WebObjects/MZFinance.woa/wa/reportAProblem?a%3D1497977514%26cc%3Dus%26d%3D683263808%26o%3Di%26p%3D29065684906671%26pli%3D29092219632071%26s%3D1&amp;source=gmail&amp;ust=1673963081204000&amp;usg=AOvVaw3y47L06B2LTrL6qsmaW2Hq"
						>
							Report a Problem
						</Link>
					</Text>
				</Column>
				<Column class="table-cell pr-[20px] w-[100px] align-bottom" align="right">
					<span class="text-[12px] font-[600] m-0">$14.99</span>
				</Column>
			</Section>
			<Hr class="mt-[30px] mb-0" />
			<Section align="right">
				<Column class="table-cell" align="right">
					<Text class="m-0 text-[#666666] text-[10px] font-[600] pr-[30px] text-right">TOTAL</Text>
				</Column>
				<Column class="h-[48px] border-0 border-l border-solid border-[#eeeeee]" />
				<Column class="table-cell w-[90px]">
					<Text class="m-0 mr-[20px] text-[16px] font-[600] whitespace-nowrap text-right"
						>$14.99</Text
					>
				</Column>
			</Section>
			<Hr class="mb-[75px]" />
			<Section>
				<Column align="center" class="block">
					<Img src={`${baseUrl}/apple-card-icon.png`} width="60" height="17" alt="Apple Card" />
					<Text class="text-[24px] font-[500]">Save 3% on all your Apple purchases.</Text>
					<Link
						class="text-[rgb(0,126,255)] no-underline"
						href="https://wallet.apple.com/apple-card/setup/feature/ccs?referrer=cid%3Dapy-120-100003"
					>
						<Img
							src={`${baseUrl}/apple-wallet.png`}
							width="28"
							height="28"
							alt="Apple Wallet"
							class="display-[inherit] pr-[8px] align-middle"
							style={{ display: 'inherit' }}
						/>
						<span class="text-[14px] font-[400] no-underline">Apply and use in minutes</span>
					</Link>
				</Column>
			</Section>
			<Hr class="mt-[65px] mb-[20px] mx-0" />
			<Text class="text-[12px] text-[#666666] leading-tight">
				1. 3% savings is earned as Daily Cash and is transferred to your Apple Cash card when
				transactions post to your Apple Card account. If you do not have an Apple Cash card, Daily
				Cash can be applied by you as a credit on your statement balance. 3% is the total amount of
				Daily Cash earned for these purchases. See the Apple Card Customer Agreement for more
				details on Daily Cash and qualifying transactions.
				<br />
				<br />
				2. Subject to credit approval.
				<br />
				<br />
				To access and use all the features of Apple Card, you must add Apple Card to Wallet on an iPhone
				or iPad with iOS or iPadOS 13.2 or later. Update to the latest version of iOS or iPadOS by going
				to Settings &gt; General &gt; Software Update. Tap Download and Install.
				<br />
				<br />
				Available for qualifying applicants in the United States.
				<br />
				<br />
				Apple Card is issued by Goldman Sachs Bank USA, Salt Lake City Branch.
				<br />
				<br />
				If you reside in the US territories, please call Goldman Sachs at 877-255-5923 with questions
				about Apple Card.
			</Text>
			<Text class="text-[12px] text-[#666666] m-[20px 0 0 0] leading-tight text-center">
				Privacy: We use a
				<Link href="http://support.apple.com/kb/HT207233" class="text-[rgb(0,115,255)]">
					{' '}
					Subscriber ID{' '}
				</Link>
				to provide reports to developers.
			</Text>
			<Text class="text-[12px] text-[#666666] m-[20px 0 0 0] leading-tight text-center">
				Get help with subscriptions and purchases.
				<Link
					href="https://support.apple.com/billing?cid=email_receipt"
					class="text-[rgb(0,115,255)]"
				>
					Visit Apple Support.
				</Link>
				<br />
				<br />
				Learn how to{' '}
				<Link
					href="https://support.apple.com/kb/HT204030?cid=email_receipt_itunes_article_HT204030"
				>
					manage your password preferences
				</Link>{' '}
				for iTunes, Apple Books, and App Store purchases.
				<br />
				<br />
				<br />
				You have the option to stop receiving email receipts for your subscription renewals. If you have
				opted out, you can still view your receipts in your account under Purchase History. To manage
				receipts or to opt in again, go to{' '}
				<Link
					href="https://finance-app.itunes.apple.com/account/subscriptions?unsupportedRedirectUrl=https://apps.apple.com/US/invoice"
				>
					Account Settings.
				</Link>
			</Text>
			<Img
				class="mx-auto"
				src={`${baseUrl}/apple-logo.png`}
				width="26"
				height="26"
				alt="Apple Card"
			/>
			<Text class="mt-[8px] text-center text-[12px] text-[#666666]">
				<Link href="https://buy.itunes.apple.com/WebObjects/MZFinance.woa/wa/accountSummary?mt=8">
					Account Settings
				</Link>{' '}
				•{' '}
				<Link href="https://www.apple.com/legal/itunes/us/sales.html">Terms of Sale</Link>{' '}
				•{' '}
				<Link href="https://www.apple.com/legal/privacy/">
					Privacy Policy{' '}
				</Link>
			</Text>
			<Text class="mt-[25px] text-center text-[12px] text-[#666666]">
				Copyright © 2023 Apple Inc. <br />{' '}
				<Link href="https://www.apple.com/legal/">All rights reserved</Link>
			</Text>
		</Container>
	</Body>
</Html>
