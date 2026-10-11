import styles from "./footer.module.css";

function Footer(){
	return(
		<div className={styles.foot_row}>
			<div className={styles.foot_help}><a href="https://t.me/deletu1844">Служба поддержки</a></div>
			<div className="foot_when">
				<p>По всем вопросам обращаться в <a href="https://t.me/deletu1844">службу поддержки</a> ООО "Store-Online". </p>
				<p>All rights reserved, when copying, an application will be filed with the court</p>
			</div>
		</div>
	);
}
export default Footer;